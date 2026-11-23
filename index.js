/**
 * dsh-quota-inline — Host half.
 *
 * Reads one provider's balance or usage windows for the inline reading and the
 * settings page. Credentials come from the DSH `credentials` service, are used
 * only in this process, and never cross to the browser: the client receives
 * labels, amounts, currencies, percentages, and error text.
 */

import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const PACKAGE_VERSION = '0.1.0'
const API = '/dsh-quota-inline/api/'
const SETTINGS_VERSION = 1
const CACHE_MS = 30_000
const MAX_BODY_BYTES = 256 * 1024
const MAX_RESPONSE_BYTES = 512 * 1024
const DEFAULT_TIMEOUT_MS = 10_000

/** Host services every activation needs; the account, LLM, and default-model
 * services stay optional so a minimal profile can still mount the plugin. */
export const inject = ['webServer', 'credentials']

/** One validation failure with a stable code the routes return to the browser. */
export class QuotaError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'QuotaError'
    this.code = code
  }
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Translate a `*`/`?` glob into an anchored, case-insensitive RegExp. */
export function globToRegExp(pattern) {
  const escaped = String(pattern)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
  return new RegExp(`^${escaped}$`, 'i')
}

/** Split `a.b[0].c` / `a.b[*]` into key/index tokens; null when malformed. */
function tokenizePath(path) {
  if (typeof path !== 'string' || path.trim() === '') return null
  const tokens = []
  for (const part of path.split('.')) {
    const match = /^([^[\]]+)(?:\[(\*|\d+)\])?$/.exec(part.trim())
    if (!match) return null
    tokens.push({ key: match[1], index: match[2] === undefined ? undefined : match[2] })
  }
  return tokens
}

function walkPath(node, tokens) {
  if (tokens.length === 0) return [node]
  const [token, ...rest] = tokens
  if (node === null || typeof node !== 'object') return []
  const value = node[token.key]
  if (token.index === undefined) return walkPath(value, rest)
  if (token.index === '*') {
    if (!Array.isArray(value)) return []
    return value.flatMap((item) => walkPath(item, rest))
  }
  if (!Array.isArray(value)) return []
  return walkPath(value[Number(token.index)], rest)
}

/** Every value a JSON path selects, with `[*]` expanding arrays. */
export function pathValues(payload, path) {
  const tokens = tokenizePath(path)
  if (tokens === null) return []
  return walkPath(payload, tokens)
}

/** First finite number selected by a path, or null. */
function firstNumber(payload, path) {
  for (const value of pathValues(payload, path)) {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
  }
  return null
}

/** Used percentage for one window, clamped to 0–100; null when unusable. */
export function windowPercent(used, limit) {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return null
  return Math.min(100, Math.max(0, Math.round((used / limit) * 10_000) / 100))
}

/**
 * Turn one parsed response into reading items.
 *
 * @param payload - parsed JSON response.
 * @param template - normalized template.
 * @returns amount items (`{ label, amount, currency }`) and window items
 * (`{ label, percent, used, limit }`).
 */
export function extractItems(payload, template) {
  const extract = template?.extract || {}
  const items = []
  const balance = extract.balance
  // Most balance endpoints carry the currency at the root (`currency` or
  // `unit`), so a template only needs a currency path when it does not.
  const rootCurrency = typeof payload?.currency === 'string' && payload.currency !== ''
    ? payload.currency
    : typeof payload?.unit === 'string' && payload.unit !== ''
      ? payload.unit
      : ''
  if (balance && typeof balance.amountPath === 'string' && balance.amountPath.trim() !== '') {
    const amounts = pathValues(payload, balance.amountPath)
    const currencies = typeof balance.currencyPath === 'string' ? pathValues(payload, balance.currencyPath) : []
    const label = balance.label || template?.label || 'Balance'
    amounts.forEach((amount, index) => {
      const numeric = Number(amount)
      if (!Number.isFinite(numeric)) return
      const currency = currencies[index] ?? balance.currency ?? rootCurrency
      items.push({ label, amount: String(amount), currency: String(currency) })
    })
  }
  for (const window of Array.isArray(extract.windows) ? extract.windows : []) {
    const used = firstNumber(payload, window.usedPath)
    const limit = firstNumber(payload, window.limitPath)
    const percent = windowPercent(used, limit)
    if (percent === null) continue
    items.push({ label: window.label || 'Usage', percent, used, limit })
  }
  return items
}

/** Resolve the settings file without hard-coding an OS path. */
export function settingsPath(env = {}, homeDir = homedir()) {
  const dshHome = typeof env.DSH_HOME === 'string' && env.DSH_HOME.trim() !== ''
    ? env.DSH_HOME
    : join(homeDir, '.dsh')
  return join(dshHome, 'dsh-quota-inline', 'settings.json')
}

export function defaultSettings() {
  return {
    version: SETTINGS_VERSION,
    refreshSeconds: 60,
    limitMode: 'left',
    providers: {},
    display: {},
  }
}

function normalizeRefreshSeconds(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 60
  return Math.min(3600, Math.max(10, Math.round(numeric)))
}

function normalizePath(value) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined
}

/** Validate and normalize one provider template. */
export function validateTemplate(input, { allowId = false } = {}) {
  if (!isPlainObject(input)) throw new QuotaError('invalid-template', '查询模板必须是对象')
  const match = isPlainObject(input.match) ? input.match : {}
  const providerIds = Array.isArray(match.providerIds)
    ? match.providerIds.filter((id) => typeof id === 'string' && id.trim() !== '')
    : []
  const request = isPlainObject(input.request) ? input.request : {}
  const method = typeof request.method === 'string' ? request.method.toUpperCase() : 'GET'
  if (method !== 'GET' && method !== 'POST') {
    throw new QuotaError('invalid-template', '请求方法只支持 GET 或 POST')
  }
  if (typeof request.url !== 'string' || request.url.trim() === '') {
    throw new QuotaError('invalid-template', '请求 URL 不能为空')
  }
  let parsed
  try {
    parsed = new URL(request.url)
  } catch {
    throw new QuotaError('invalid-template', '请求 URL 不是合法地址')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new QuotaError('invalid-template', '请求 URL 只支持 http/https')
  }
  const auth = isPlainObject(input.auth) ? input.auth : {}
  const authType = typeof auth.type === 'string' ? auth.type : 'bearer'
  if (!['bearer', 'x-api-key', 'none'].includes(authType)) {
    throw new QuotaError('invalid-template', 'auth.type 只支持 bearer / x-api-key / none')
  }
  const credentialRefs = Array.isArray(auth.credentialRefs)
    ? auth.credentialRefs.filter((ref) => typeof ref === 'string' && ref.trim() !== '')
    : []
  const extract = isPlainObject(input.extract) ? input.extract : {}
  const balance = isPlainObject(extract.balance)
    ? {
        label: typeof extract.balance.label === 'string' && extract.balance.label !== '' ? extract.balance.label : '余额',
        amountPath: normalizePath(extract.balance.amountPath),
        currency: typeof extract.balance.currency === 'string' ? extract.balance.currency : undefined,
        currencyPath: normalizePath(extract.balance.currencyPath),
      }
    : null
  if (balance && balance.amountPath === undefined) {
    throw new QuotaError('invalid-template', '余额提取路径不能为空')
  }
  const windows = Array.isArray(extract.windows)
    ? extract.windows
        .filter((window) => isPlainObject(window))
        .map((window) => ({
          label: typeof window.label === 'string' && window.label !== '' ? window.label : 'Usage',
          usedPath: normalizePath(window.usedPath),
          limitPath: normalizePath(window.limitPath),
        }))
        .filter((window) => window.usedPath !== undefined && window.limitPath !== undefined)
    : []
  if (!balance && windows.length === 0) {
    throw new QuotaError('invalid-template', '至少需要一个余额路径或一个限额窗口')
  }
  const headers = {}
  if (isPlainObject(request.headers)) {
    for (const [name, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') headers[name] = value
    }
  }
  const timeoutMs = Number.isFinite(Number(input.timeoutMs))
    ? Math.min(30_000, Math.max(1_000, Number(input.timeoutMs)))
    : DEFAULT_TIMEOUT_MS
  return {
    ...(allowId && typeof input.id === 'string' ? { id: input.id } : {}),
    label: typeof input.label === 'string' && input.label !== '' ? input.label : 'Custom',
    match: { providerIds, baseURLPatterns: [] },
    request: { method, url: request.url, headers, body: request.body ?? null },
    auth: { type: authType, credentialRefs },
    extract: { balance, windows },
    timeoutMs,
  }
}

/** Validate and normalize a complete settings object. */
export function sanitizeSettings(input) {
  if (!isPlainObject(input)) throw new QuotaError('invalid-settings', '配置必须是对象')
  const settings = defaultSettings()
  settings.refreshSeconds = normalizeRefreshSeconds(input.refreshSeconds)
  if (input.limitMode === 'used' || input.limitMode === 'left') settings.limitMode = input.limitMode
  if (isPlainObject(input.display)) {
    for (const [provider, value] of Object.entries(input.display)) {
      // Reading overrides are keyed by provider id; an unknown shape is dropped
      // instead of failing the whole save.
      if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(provider)) continue
      if (typeof value !== 'string' || !/^(auto|both|amount:\d{1,2}|window:\d{1,2})$/.test(value)) continue
      settings.display[provider] = value
    }
  }
  if (isPlainObject(input.providers)) {
    for (const [id, entry] of Object.entries(input.providers)) {
      if (!/^[a-z0-9][a-z0-9._-]{0,63}$/i.test(id)) {
        throw new QuotaError('invalid-settings', `供应商 id 不合法: ${id}`)
      }
      if (!isPlainObject(entry) || !isPlainObject(entry.template)) continue
      settings.providers[id] = {
        enabled: entry.enabled !== false,
        template: validateTemplate(entry.template, { allowId: true }),
      }
    }
  }
  return settings
}

/** Bundled probes; custom templates override a built-in with the same id. */
export const BUILTIN_TEMPLATES = [
  {
    id: 'deepseek-account',
    label: 'DeepSeek Account',
    kind: 'account',
    match: { providerIds: ['deepseek-account'], baseURLPatterns: [] },
  },
  {
    id: 'deepseek-official',
    label: 'DeepSeek API',
    kind: 'http',
    match: { providerIds: ['deepseek-official', 'deepseek-*'], baseURLPatterns: ['*api.deepseek.com*'] },
    request: { method: 'GET', url: 'https://api.deepseek.com/user/balance', headers: {}, body: null },
    auth: { type: 'bearer', credentialRefs: ['DEEPSEEK_API_KEY'] },
    extract: {
      balance: {
        label: '余额',
        amountPath: 'balance_infos[*].total_balance',
        currencyPath: 'balance_infos[*].currency',
      },
      windows: [],
    },
    timeoutMs: DEFAULT_TIMEOUT_MS,
  },
]

function matchAny(value, patterns) {
  if (typeof value !== 'string' || value === '') return false
  return patterns.some((pattern) => typeof pattern === 'string' && globToRegExp(pattern).test(value))
}

/** Custom templates first; otherwise the first built-in whose provider id matches. */
export function matchTemplate({ provider, builtins = BUILTIN_TEMPLATES, custom = {} }) {
  for (const [id, entry] of Object.entries(custom || {})) {
    if (!entry || entry.enabled === false || !isPlainObject(entry.template)) continue
    const template = { ...entry.template, id: entry.template.id || id }
    if (matchAny(provider, template.match?.providerIds || [])) return { template, source: 'custom' }
  }
  for (const template of builtins) {
    if (matchAny(provider, template.match?.providerIds || [])) return { template, source: 'builtin' }
  }
  return null
}

function accountMetadata() {
  return {
    version: PACKAGE_VERSION,
    locale: 'en',
    timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
  }
}

function authHeaders(template, key) {
  const headers = { accept: 'application/json' }
  if (template.auth.type === 'bearer') headers.authorization = `Bearer ${key}`
  else if (template.auth.type === 'x-api-key') headers['x-api-key'] = key
  return { ...headers, ...(template.request.headers || {}) }
}

async function resolveKey(ctx, template) {
  const refs = Array.isArray(template.auth?.credentialRefs) ? template.auth.credentialRefs : []
  for (const ref of refs) {
    try {
      const resolved = await ctx.credentials.resolve(ref)
      if (resolved && typeof resolved.value === 'string' && resolved.value !== '') return resolved.value
    } catch {
      /* try the next reference */
    }
  }
  return undefined
}

async function fetchItems(ctx, template) {
  if (template.auth.type !== 'none') {
    const key = await resolveKey(ctx, template)
    if (!key) return { status: 'no-credential' }
    template = { ...template, request: { ...template.request, headers: authHeaders(template, key) } }
  } else {
    template = { ...template, request: { ...template.request, headers: { accept: 'application/json', ...(template.request.headers || {}) } } }
  }
  const init = {
    method: template.request.method,
    headers: template.request.headers,
    signal: AbortSignal.timeout(template.timeoutMs || DEFAULT_TIMEOUT_MS),
  }
  if (template.request.method !== 'GET' && template.request.body !== null && template.request.body !== undefined) {
    init.body = typeof template.request.body === 'string' ? template.request.body : JSON.stringify(template.request.body)
    if (!init.headers['content-type']) init.headers['content-type'] = 'application/json'
  }
  let response
  try {
    response = await fetch(template.request.url, init)
  } catch (error) {
    return { status: 'error', message: `请求失败: ${error?.message || String(error)}` }
  }
  let text = ''
  try {
    text = await response.text()
  } catch {
    text = ''
  }
  if (text.length > MAX_RESPONSE_BYTES) text = text.slice(0, MAX_RESPONSE_BYTES)
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    payload = undefined
  }
  if (!response.ok) {
    return { status: 'error', message: `HTTP ${response.status}`, httpStatus: response.status, sample: text.slice(0, 600) }
  }
  if (payload === undefined) {
    return { status: 'error', message: '响应不是合法 JSON', httpStatus: response.status, sample: text.slice(0, 600) }
  }
  const items = extractItems(payload, template)
  if (items.length === 0) {
    return { status: 'error', message: '响应里没有可提取的读数', httpStatus: response.status, sample: text.slice(0, 600) }
  }
  return { status: 'ok', items, httpStatus: response.status }
}

async function accountItems(ctx) {
  const account = ctx.get('deepseekAccount')
  if (!account) return { status: 'unsupported' }
  try {
    const balance = await account.getBalance(accountMetadata())
    if (balance === null || balance === undefined) return { status: 'signed-out' }
    if (balance.status !== 'ready') return { status: 'error', message: '账号余额读取失败' }
    const items = []
    for (const wallet of balance.value || []) {
      items.push({ label: '余额', amount: String(wallet.balance), currency: wallet.currency })
    }
    for (const wallet of balance.bonusWallets || []) {
      items.push({ label: '赠金', amount: String(wallet.balance), currency: wallet.currency })
    }
    if (items.length === 0) return { status: 'error', message: '账号没有返回钱包' }
    return { status: 'ok', items }
  } catch (error) {
    return { status: 'error', message: error?.message || String(error) }
  }
}

function displayNameOf(ctx, provider, template) {
  const llm = ctx.get('llm')
  try {
    const info = llm?.listProviders?.()?.find((entry) => entry && entry.id === provider)
    if (info && typeof info.name === 'string' && info.name !== '') return info.name
  } catch {
    /* fall through to the template label */
  }
  return template?.label || provider
}

/** Read the browser-facing settings payload. */
function settingsPayload(settings) {
  return {
    version: SETTINGS_VERSION,
    refreshSeconds: settings.refreshSeconds,
    limitMode: settings.limitMode,
    providers: settings.providers,
    display: settings.display,
  }
}

function json(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(body)
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new QuotaError('payload-too-large', '请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('error', reject)
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8')
      if (text.trim() === '') return resolve({})
      try {
        resolve(JSON.parse(text))
      } catch {
        reject(new QuotaError('invalid-json', '请求体不是合法 JSON'))
      }
    })
  })
}

function handleError(res, error) {
  if (error instanceof QuotaError) {
    json(res, 400, { error: error.code, message: error.message })
    return
  }
  json(res, 500, { error: 'internal', message: error?.message || String(error) })
}

/** Mount the routes; every effect is disposed with the plugin. */
export function apply(ctx) {
  const webServer = ctx.get('webServer')
  if (!webServer) throw new Error('dsh-quota-inline requires the webServer service')
  const cache = new Map()

  const configPath = () => settingsPath(process.env)

  async function loadSettings() {
    try {
      return sanitizeSettings(JSON.parse(await readFile(configPath(), 'utf8')))
    } catch (error) {
      if (error && error.code === 'ENOENT') return defaultSettings()
      if (error instanceof QuotaError) throw error
      throw new QuotaError('invalid-settings', `读取设置失败: ${error.message}`)
    }
  }

  async function saveSettings(settings) {
    const path = configPath()
    await mkdir(join(path, '..'), { recursive: true })
    const tmp = `${path}.${process.pid}.tmp`
    await writeFile(tmp, `${JSON.stringify(settings, null, 2)}\n`, 'utf8')
    try {
      await rename(tmp, path)
    } catch (error) {
      if (error && (error.code === 'EEXIST' || error.code === 'EPERM')) {
        await unlink(path).catch(() => {})
        await rename(tmp, path)
      } else {
        await unlink(tmp).catch(() => {})
        throw error
      }
    }
  }

  async function computeStatus(provider, model, { refresh = false } = {}) {
    const settings = await loadSettings()
    const llm = ctx.get('llm')
    let selected = provider
    if (!selected) {
      try {
        selected = ctx.get('agentDefaultModel')?.currentSelection?.()?.provider
      } catch {
        selected = undefined
      }
    }
    if (!selected) {
      return { status: 'error', message: '当前会话没有可用的模型供应商', refreshSeconds: settings.refreshSeconds }
    }
    const cached = cache.get(selected)
    if (!refresh && cached && cached.expiresAt > Date.now()) return cached.value
    const matched = matchTemplate({ provider: selected, custom: settings.providers })
    const base = {
      provider: selected,
      model: model || null,
      displayName: displayNameOf(ctx, selected, matched?.template),
      refreshSeconds: settings.refreshSeconds,
      updatedAt: new Date().toISOString(),
    }
    let outcome
    if (!matched) {
      outcome = { ...base, status: 'unsupported', items: [] }
    } else if (matched.template.kind === 'account') {
      const result = await accountItems(ctx)
      outcome = { ...base, status: result.status, items: result.items || [], message: result.message }
    } else {
      const result = await fetchItems(ctx, matched.template)
      outcome = {
        ...base,
        status: result.status,
        items: result.items || [],
        message: result.message,
        httpStatus: result.httpStatus,
        sample: result.sample,
      }
    }
    if (outcome.status === 'ok') cache.set(selected, { expiresAt: Date.now() + CACHE_MS, value: outcome })
    return outcome
  }

  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: `${API}status`,
    handler: async (req, res) => {
      if (req.method !== 'GET') return json(res, 405, { error: 'method-not-allowed' })
      try {
        const url = new URL(req.url, 'http://localhost')
        json(res, 200, await computeStatus(
          url.searchParams.get('provider') || undefined,
          url.searchParams.get('model') || undefined,
          { refresh: url.searchParams.get('refresh') === '1' },
        ))
      } catch (error) {
        handleError(res, error)
      }
    },
  }), 'dsh-quota-inline: status route')

  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: `${API}settings`,
    handler: async (req, res) => {
      try {
        if (req.method === 'GET') {
          json(res, 200, settingsPayload(await loadSettings()))
          return
        }
        if (req.method !== 'POST') return json(res, 405, { error: 'method-not-allowed' })
        const origin = req.headers.origin
        if (origin && origin !== webServer.getOrigin()) return json(res, 403, { error: 'origin-not-allowed' })
        if (!String(req.headers['content-type'] || '').includes('application/json')) {
          return json(res, 415, { error: 'json-required' })
        }
        const settings = sanitizeSettings(await readJsonBody(req))
        await saveSettings(settings)
        cache.clear()
        json(res, 200, { ok: true, settings: settingsPayload(settings) })
      } catch (error) {
        handleError(res, error)
      }
    },
  }), 'dsh-quota-inline: settings route')

  ctx.effect(() => webServer.register({
    kind: 'exact',
    path: `${API}probe`,
    handler: async (req, res) => {
      if (req.method !== 'POST') return json(res, 405, { error: 'method-not-allowed' })
      try {
        const origin = req.headers.origin
        if (origin && origin !== webServer.getOrigin()) return json(res, 403, { error: 'origin-not-allowed' })
        if (!String(req.headers['content-type'] || '').includes('application/json')) {
          return json(res, 415, { error: 'json-required' })
        }
        const body = await readJsonBody(req)
        const provider = typeof body.provider === 'string' ? body.provider : ''
        if (provider === '') return json(res, 400, { error: 'provider-required', message: '缺少 provider' })
        const template = validateTemplate(body.template, { allowId: true })
        const result = await fetchItems(ctx, template)
        json(res, 200, {
          status: result.status,
          provider,
          httpStatus: result.httpStatus,
          items: result.items || [],
          message: result.message,
          sample: result.sample,
        })
      } catch (error) {
        handleError(res, error)
      }
    },
  }), 'dsh-quota-inline: probe route')

  // A finished model response changes spend, so the next poll re-reads instead
  // of serving the 30-second cache.
  ctx.effect(() => ctx.on('session/event', (_session, event) => {
    if (event && event.type === 'assistant/message') cache.clear()
  }), 'dsh-quota-inline: cache invalidation')

  ctx.logger?.info?.(`dsh-quota-inline: mounted at ${API}`)
}
