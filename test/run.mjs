/**
 * Node-side suites: settings validation, JSON paths, window percentages,
 * extraction, template matching, the settings path, and the client module
 * wiring. Run with `npm test`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import {
  BUILTIN_TEMPLATES,
  defaultSettings,
  extractItems,
  globToRegExp,
  matchTemplate,
  pathValues,
  sanitizeSettings,
  settingsPath,
  validateTemplate,
  windowPercent,
} from '../index.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const deepseekPayload = {
  is_available: true,
  balance_infos: [{ currency: 'CNY', total_balance: '128.40', granted_balance: '0.00', topped_up_balance: '128.40' }],
}

const relayPayload = {
  unit: 'USD',
  remaining: 20.5911302,
  subscription: { weekly_usage_usd: 67.4088698, weekly_limit_usd: 88, monthly_usage_usd: 67.4088698, monthly_limit_usd: 380 },
}

const relayTemplate = validateTemplate({
  label: 'Relay',
  match: { providerIds: ['relay'] },
  request: { method: 'GET', url: 'https://relay.example.com/v1/usage' },
  auth: { type: 'bearer', credentialRefs: ['RELAY_KEY'] },
  extract: {
    balance: { label: '余额', amountPath: 'remaining', currencyPath: 'unit' },
    windows: [
      { label: '本周', usedPath: 'subscription.weekly_usage_usd', limitPath: 'subscription.weekly_limit_usd' },
      { label: '本月', usedPath: 'subscription.monthly_usage_usd', limitPath: 'subscription.monthly_limit_usd' },
      { label: '漏掉', usedPath: 'subscription.daily_usage_usd', limitPath: 'subscription.daily_limit_usd' },
    ],
  },
})

test('defaults are left, 60 seconds, and no providers', () => {
  const settings = defaultSettings()
  assert.equal(settings.version, 1)
  assert.equal(settings.refreshSeconds, 60)
  assert.equal(settings.limitMode, 'left')
  assert.deepEqual(settings.providers, {})
  assert.deepEqual(settings.display, {})
})

test('sanitizeSettings clamps and validates', () => {
  assert.equal(sanitizeSettings({ refreshSeconds: 1 }).refreshSeconds, 10)
  assert.equal(sanitizeSettings({ refreshSeconds: 99999 }).refreshSeconds, 3600)
  assert.equal(sanitizeSettings({ limitMode: 'used' }).limitMode, 'used')
  assert.equal(sanitizeSettings({ limitMode: 'sideways' }).limitMode, 'left')
  assert.throws(() => sanitizeSettings({ providers: { 'Bad Id!': {} } }), /供应商 id 不合法/)
  assert.throws(() => sanitizeSettings(null), /配置必须是对象/)
})

test('sanitizeSettings keeps valid reading overrides and drops the rest', () => {
  const settings = sanitizeSettings({
    display: {
      'my-relay': 'both',
      'deepseek-official': 'amount:0',
      'window-user': 'window:2',
      'bad-value': 'sideways',
      'bad key': 'auto',
    },
  })
  assert.deepEqual(settings.display, {
    'my-relay': 'both',
    'deepseek-official': 'amount:0',
    'window-user': 'window:2',
  })
})

test('sanitizeSettings keeps a valid provider and drops unknown fields', () => {
  const settings = sanitizeSettings({
    refreshSeconds: 30,
    limitMode: 'used',
    providers: { relay: { enabled: true, template: relayTemplate, extra: 'ignored' } },
  })
  assert.equal(Object.keys(settings.providers).length, 1)
  assert.equal(settings.providers.relay.template.extract.windows.length, 3)
  assert.equal(settings.providers.relay.template.extract.windows[2].label, '漏掉')
})

test('validateTemplate rejects unusable templates', () => {
  assert.throws(() => validateTemplate({ request: { url: 'ftp://x' } }), /http\/https/)
  assert.throws(() => validateTemplate({ request: { url: 'https://x', method: 'PUT' } }), /GET 或 POST/)
  assert.throws(() => validateTemplate({ request: { url: 'https://x' }, auth: { type: 'basic' } }), /auth\.type/)
  assert.throws(() => validateTemplate({ request: { url: 'https://x' }, extract: {} }), /至少需要一个/)
  assert.throws(
    () => validateTemplate({ request: { url: 'https://x' }, extract: { balance: { label: 'B' } } }),
    /余额提取路径不能为空/,
  )
})

test('validateTemplate keeps only complete windows and clamps the timeout', () => {
  const template = validateTemplate({
    request: { url: 'https://x' },
    extract: {
      windows: [
        { label: 'A', usedPath: 'a.used', limitPath: 'a.limit' },
        { label: 'B', usedPath: 'b.used' },
      ],
    },
    timeoutMs: 500,
  })
  assert.equal(template.extract.windows.length, 1)
  assert.equal(template.timeoutMs, 1000)
  assert.equal(template.extract.balance, null)
})

test('globToRegExp anchors and ignores case', () => {
  assert.ok(globToRegExp('deepseek-*').test('DeepSeek-Official'))
  assert.ok(!globToRegExp('deepseek-*').test('openrouter'))
  assert.ok(globToRegExp('a.b').test('a.b'))
  assert.ok(!globToRegExp('a.b').test('axb'))
})

test('pathValues walks dots, indexes, and wildcards', () => {
  assert.deepEqual(pathValues(deepseekPayload, 'balance_infos[*].total_balance'), ['128.40'])
  assert.deepEqual(pathValues(relayPayload, 'subscription.weekly_limit_usd'), [88])
  assert.deepEqual(pathValues({ list: [{ v: 1 }, { v: 2 }] }, 'list[1].v'), [2])
  assert.deepEqual(pathValues(relayPayload, 'missing.path'), [])
  assert.deepEqual(pathValues(relayPayload, 'not a path['), [])
})

test('windowPercent clamps and rejects unusable input', () => {
  assert.equal(windowPercent(50, 100), 50)
  assert.equal(windowPercent(0, 88), 0)
  assert.equal(windowPercent(200, 100), 100)
  assert.equal(windowPercent(1, 0), null)
  assert.equal(windowPercent(Number.NaN, 10), null)
  assert.equal(windowPercent(1, 3), 33.33)
})

test('extractItems reads a DeepSeek balance', () => {
  const template = BUILTIN_TEMPLATES.find((entry) => entry.id === 'deepseek-official')
  const items = extractItems(deepseekPayload, template)
  assert.deepEqual(items, [{ label: '余额', amount: '128.40', currency: 'CNY' }])
})

test('extractItems reads a balance and the complete windows', () => {
  const items = extractItems(relayPayload, relayTemplate)
  assert.equal(items.length, 3)
  assert.equal(items[0].label, '余额')
  assert.equal(items[0].currency, 'USD')
  const weekly = items[1]
  assert.equal(weekly.label, '本周')
  assert.equal(weekly.percent, 76.6)
  assert.equal(weekly.used, 67.4088698)
  assert.equal(weekly.limit, 88)
  assert.equal(items[2].label, '本月')
  assert.equal(items[2].percent, 17.74)
})

test('extractItems reads the currency from the response root when no path is given', () => {
  const template = validateTemplate({
    request: { url: 'https://x' },
    extract: { balance: { label: '余额', amountPath: 'remaining' } },
  })
  assert.deepEqual(extractItems({ remaining: 0.75, unit: 'USD' }, template), [
    { label: '余额', amount: '0.75', currency: 'USD' },
  ])
  assert.deepEqual(extractItems({ remaining: 1.5, currency: 'CNY' }, template), [
    { label: '余额', amount: '1.5', currency: 'CNY' },
  ])
})

test('extractItems skips a window whose paths are absent', () => {
  const items = extractItems({ subscription: {} }, relayTemplate)
  assert.deepEqual(items, [])
})

test('matchTemplate prefers a custom template over the built-in', () => {
  const custom = { 'deepseek-official': { enabled: true, template: { ...relayTemplate, match: { providerIds: ['deepseek-official'] } } } }
  const matched = matchTemplate({ provider: 'deepseek-official', custom })
  assert.equal(matched.source, 'custom')
})

test('matchTemplate falls back to built-ins and reports no match', () => {
  assert.equal(matchTemplate({ provider: 'deepseek-account' }).template.id, 'deepseek-account')
  assert.equal(matchTemplate({ provider: 'deepseek-official' }).template.id, 'deepseek-official')
  assert.equal(matchTemplate({ provider: 'openrouter' }), null)
  // A disabled custom template must not shadow the built-in.
  const disabled = { 'deepseek-official': { enabled: false, template: relayTemplate } }
  assert.equal(matchTemplate({ provider: 'deepseek-official', custom: disabled }).source, 'builtin')
})

test('settingsPath honours DSH_HOME and falls back to the home directory', () => {
  assert.equal(
    settingsPath({ DSH_HOME: '/srv/dsh' }, '/home/x'),
    join('/srv/dsh', 'dsh-quota-inline', 'settings.json'),
  )
  assert.equal(
    settingsPath({}, '/home/x'),
    join('/home/x', '.dsh', 'dsh-quota-inline', 'settings.json'),
  )
})

test('locale files expose localized display metadata', () => {
  for (const language of ['en', 'zh']) {
    const meta = JSON.parse(readFileSync(join(root, 'locale', `${language}.json`), 'utf8')).meta
    assert.ok(meta.title && meta.title.length > 0)
    assert.ok(meta.description && meta.description.length > 0)
    assert.ok(readFileSync(join(root, meta.detail), 'utf8').length > 0)
  }
})

test('the client module loads and registers both seats', () => {
  const registrations = []
  globalThis.window = {
    __ModuleLoader__: { load: (spec) => { globalThis.__spec = spec } },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
  }
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} }
  const React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect() {},
    useCallback: (fn) => fn,
    useRef: (value) => ({ current: value }),
  }
  // eslint-disable-next-line no-eval
  eval(readFileSync(join(root, 'client.js'), 'utf8'))
  const spec = globalThis.__spec
  assert.equal(spec.id, 'dsh-quota-inline')
  const mod = spec.factory((id) => (id === 'react' ? React : id === 'react-dom' ? { createPortal: () => null } : {}))
  assert.deepEqual(mod.inject, ['slots', 'sessions', 'locale'])
  mod.apply({
    slots: {
      inject: (_slot, fn) => fn(),
      register: (options) => {
        registrations.push(options)
        return { dispose() {} }
      },
    },
  })
  assert.deepEqual(registrations.map((entry) => entry.name), ['conversation.input.right', 'settings.section'])
  assert.deepEqual(registrations.map((entry) => entry.id), ['dsh-quota-inline', 'dsh-quota-inline'])
  for (const registration of registrations) assert.equal(typeof registration.label, 'function')
})

// The reading picker lives inside the client factory, so the suite pulls those
// pure functions out of the shipped source and exercises them directly.
function extractClientFunction(source, name) {
  const marker = `\n    function ${name}(`
  const start = source.indexOf(marker)
  if (start < 0) throw new Error(`client.js is missing ${name}()`)
  const bodyStart = start + 1
  const endMarker = '\n    }\n'
  const end = source.indexOf(endMarker, bodyStart)
  if (end < 0) throw new Error(`client.js has an unterminated ${name}()`)
  return source.slice(bodyStart, end + endMarker.length)
}

const clientSource = readFileSync(join(root, 'client.js'), 'utf8')
const pureHelpers = new Function(
  [
    'percentValue',
    'symbolFor',
    'formatAmount',
    'badgeText',
    'readingFor',
    'menuOptions',
  ].map((name) => extractClientFunction(clientSource, name)).join('\n')
    + '\nreturn { badgeText, readingFor, menuOptions }',
)()

const zh = (key) => ({ leftSuffix: '剩余', usedSuffix: '已用' })[key] || key
const readings = [
  { label: '余额', amount: '0.753783999999996', currency: 'USD' },
  { label: '本周', percent: 99.58, used: 178.276, limit: 179.03 },
  { label: '本月', percent: 23.24, used: 178.276, limit: 767.25 },
]

test('readingFor picks the tightest window by default', () => {
  const reading = pureHelpers.readingFor(readings, 'auto', 'left', zh, 'zh')
  assert.equal(reading.item.label, '本周')
  assert.equal(reading.text, '本周剩余 1%')
})

test('readingFor keeps a sliver above zero', () => {
  const reading = pureHelpers.readingFor(readings, 'used', 'used', zh, 'zh')
  assert.equal(reading.text, '本周已用 99%')
})

test('readingFor honours amount and window overrides', () => {
  assert.equal(pureHelpers.readingFor(readings, 'amount:0', 'left', zh, 'zh').text, '余额 $0.75')
  assert.equal(pureHelpers.readingFor(readings, 'window:1', 'left', zh, 'zh').text, '本月剩余 77%')
})

test('readingFor joins balance and the tightest window in both mode', () => {
  assert.equal(pureHelpers.readingFor(readings, 'both', 'left', zh, 'zh').text, '$0.75 · 本周剩余 1%')
})

test('readingFor falls back to auto for a stale override', () => {
  const reading = pureHelpers.readingFor(readings, 'window:9', 'left', zh, 'zh')
  assert.equal(reading.text, '本周剩余 1%')
})

test('readingFor falls back to the balance when no window exists', () => {
  const reading = pureHelpers.readingFor([readings[0]], 'both', 'left', zh, 'zh')
  assert.equal(reading.text, '余额 $0.75')
})

test('menuOptions lists auto, balances, windows, then both', () => {
  const values = pureHelpers.menuOptions(readings, 'left', zh, 'zh').map((option) => option.value)
  assert.deepEqual(values, ['auto', 'amount:0', 'window:1', 'window:2', 'both'])
  const labels = pureHelpers.menuOptions(readings, 'left', zh, 'zh').map((option) => option.label)
  assert.equal(labels[0], 'menuAuto')
  assert.equal(labels[1], '余额 $0.75')
  assert.equal(labels[2], '本周剩余 1%')
})

test('the settings page parses provider drafts without an error state', async () => {
  const registrations = []
  let cursor = 0
  let states = []
  let spec = null
  const React = {
    Fragment: 'Fragment',
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: (initial) => {
      const index = cursor++
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial
      const set = (next) => { states[index] = typeof next === 'function' ? next(states[index]) : next }
      return [states[index], set]
    },
    useEffect: (callback) => { cursor++; callback() },
    useCallback: (callback) => { cursor++; return callback },
    useRef: (value) => { cursor++; return { current: value } },
  }
  globalThis.window = {
    __ModuleLoader__: { load: (value) => { spec = value } },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
  }
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} }
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    text: async () => JSON.stringify({
      refreshSeconds: 30,
      limitMode: 'left',
      display: { 'my-chat-gpt-account': 'both' },
      providers: {
        'my-chat-gpt-account': {
          enabled: true,
          template: {
            id: 'my-chat-gpt-account',
            label: 'ChatGPT 账号池',
            match: { providerIds: ['my-chat-gpt-account'] },
            request: { method: 'GET', url: 'https://example.test/v1/usage' },
            auth: { type: 'bearer', credentialRefs: ['KEY'] },
            extract: {
              balance: { label: '余额', amountPath: 'remaining', currencyPath: 'unit' },
              windows: [
                { label: '本周', usedPath: 'subscription.weekly_usage_usd', limitPath: 'subscription.weekly_limit_usd' },
              ],
            },
            timeoutMs: 10000,
          },
        },
      },
    }),
  })
  try {
    // eslint-disable-next-line no-eval
    eval(clientSource)
    const mod = spec.factory((id) => (id === 'react' ? React : id === 'react-dom' ? { createPortal: () => null } : {}))
    mod.apply({
      slots: {
        inject: (_slot, fn) => fn(),
        register: (options, component) => registrations.push({ options, component }),
      },
    })
    const settingsEntry = registrations.find((entry) => entry.options.name === 'settings.section')
    assert.ok(settingsEntry, 'the settings page is registered')
    cursor = 0
    states = []
    const wrapper = settingsEntry.component({ close() {} })
    const tree = wrapper.type(wrapper.props)
    assert.ok(tree, 'the settings page renders')
    await new Promise((resolve) => setTimeout(resolve, 40))
    const errors = states.filter((value) => typeof value === 'string'
      && /is not defined|is not a function|TypeError|ReferenceError/.test(value))
    assert.deepEqual(errors, [], 'the settings page reported no runtime error')
    const drafts = states.find((value) => Array.isArray(value)
      && value.length === 1 && value[0] && value[0].id === 'my-chat-gpt-account')
    assert.ok(drafts, 'provider drafts were parsed from the settings response')
  } finally {
    globalThis.fetch = originalFetch
  }
})

// The settings page converts drafts to templates and back; keep that round trip
// covered so a missing helper fails here instead of in the panel.
const conversions = new Function(
  ['splitList', 'windowsToText', 'textToWindows', 'draftFromEntry', 'entryFromDraft']
    .map((name) => extractClientFunction(clientSource, name)).join('\n')
    + '\nreturn { draftFromEntry, entryFromDraft }',
)()

test('a provider draft round-trips through the template shape', () => {
  const draft = {
    id: 'my-chat-gpt-account',
    enabled: true,
    label: 'ChatGPT 账号池',
    providerIds: 'my-chat-gpt-account, my-*',
    url: 'https://example.test/v1/usage',
    authType: 'bearer',
    credentialRefs: 'MY_KEY',
    balanceLabel: '余额',
    amountPath: 'remaining',
    currencyPath: '',
    currency: '',
    windows: '本周 | subscription.weekly_usage_usd | subscription.weekly_limit_usd\n本月 | a | b',
    timeoutMs: 5000,
  }
  const entry = conversions.entryFromDraft(draft)
  assert.deepEqual(entry.template.match.providerIds, ['my-chat-gpt-account', 'my-*'])
  assert.equal(entry.template.extract.windows.length, 2)
  assert.equal(entry.template.extract.windows[0].label, '本周')
  assert.equal(entry.template.extract.balance.amountPath, 'remaining')
  assert.equal(entry.template.extract.balance.currencyPath, undefined)
  const back = conversions.draftFromEntry(draft.id, entry)
  assert.equal(back.label, 'ChatGPT 账号池')
  assert.equal(back.providerIds, 'my-chat-gpt-account, my-*')
  assert.equal(back.windows.split('\n').length, 2)
  assert.equal(back.timeoutMs, 5000)
})
