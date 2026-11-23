/**
 * dsh-quota-inline — Client half (no build step).
 *
 * One compact reading in the composer tool row, immediately left of the model
 * selector, plus the settings page that owns the provider templates.
 */
window.__ModuleLoader__.load({
  id: 'dsh-quota-inline',
  factory(require) {
    const React = require('react')
    const { createPortal } = require('react-dom')
    const h = React.createElement
    const { useCallback, useEffect, useRef, useState } = React

    const API = '/dsh-quota-inline/api/'
    const SETTINGS_EVENT = 'dsh-quota-inline:settings-changed'
    const BADGE_SLOT = 'conversation.input.right'
    const SETTINGS_SLOT = 'settings.section'

    const MESSAGES = {
      zh: {
        unknown: '额度',
        loading: '查询中',
        okUpdated: '更新于',
        error: '查询失败',
        noCredential: '未配置密钥',
        signedOut: '未登录',
        unsupported: '暂无查询模板',
        hint: '在 设置 → 额度徽标 中添加模板',
        leftSuffix: '剩余',
        usedSuffix: '已用',
        menuLabel: '显示内容',
        menuAuto: '自动（最紧张的窗口）',
        menuBoth: '余额 + 百分比',
        menuRefresh: '刷新',
        globalTitle: '全局',
        builtinTitle: '内置查询',
        builtinAccount: '钱包余额 + 赠金',
        builtinApi: 'API Key 余额',
        builtinHint: '选中对应模型即生效，不需要配置。',
        builtinTag: '内置',
        customTitle: '自定义供应商',
        emptyProviders: '还没有自定义供应商。',
        advanced: '高级',
        hideAdvanced: '收起高级',
        disabledTag: '已停用',
        editAction: '编辑',
        collapseAction: '收起',
        currencyAuto: '币种自动从响应的 currency / unit 字段读取。',
        balance: '余额',
        bonus: '赠金',
        settingsTitle: '额度徽标',
        intro: '在输入框工具栏、模型选择器左侧显示当前模型的余额或限额窗口，只读访问本地凭证，从不索要 API Key。',
        refresh: '刷新间隔（秒）',
        refreshHint: '10–3600 秒；切换模型或点击读数会立即刷新。',
        limitMode: '限额显示',
        limitModeHint: '限额窗口显示已用还是剩余；余额不受影响。',
        limitUsed: '已用',
        limitLeft: '剩余',
        providers: '自定义供应商',
        providersHint: '按 provider id 匹配；内置的 DeepSeek 账号与 DeepSeek API 默认可用，自定义模板优先。',
        addProvider: '添加供应商',
        remove: '删除',
        enabled: '启用',
        providerId: 'provider id（逗号分隔）',
        label: '显示名',
        url: '请求 URL',
        authType: '鉴权方式',
        credentialRefs: '凭证引用（逗号分隔）',
        balanceLabel: '余额标签',
        amountPath: '余额字段路径',
        currencyPath: '币种字段路径',
        currency: '固定币种（可选）',
        windows: '限额窗口',
        windowsPlaceholder: '本周 | subscription.weekly_usage_usd | subscription.weekly_limit_usd',
        timeoutMs: '超时（毫秒）',
        test: '测试',
        testing: '测试中…',
        save: '保存',
        saving: '保存中…',
        saved: '已保存',
        testOk: 'OK',
        testFail: '失败',
        saveFailed: '保存失败',
        loadFailed: '读取设置失败',
        privacy: '凭证只在本机 Host 进程内读取，浏览器只收到标签、金额、币种与百分比。',
      },
      en: {
        unknown: 'Quota',
        loading: 'Loading',
        okUpdated: 'updated',
        error: 'Query failed',
        noCredential: 'No credential',
        signedOut: 'Signed out',
        unsupported: 'No template',
        hint: 'Add a template in Settings → Quota badge',
        leftSuffix: 'left',
        usedSuffix: 'used',
        menuLabel: 'Show',
        menuAuto: 'Auto (tightest window)',
        menuBoth: 'Balance + percent',
        menuRefresh: 'Refresh',
        globalTitle: 'General',
        builtinTitle: 'Built-in probes',
        builtinAccount: 'Wallet + bonus',
        builtinApi: 'API-key balance',
        builtinHint: 'Select a matching model; no configuration needed.',
        builtinTag: 'Built in',
        customTitle: 'Custom providers',
        emptyProviders: 'No custom providers yet.',
        advanced: 'Advanced',
        hideAdvanced: 'Hide advanced',
        disabledTag: 'Disabled',
        editAction: 'Edit',
        collapseAction: 'Collapse',
        currencyAuto: 'Currency is read from the response’s currency or unit field.',
        balance: 'Balance',
        bonus: 'Bonus',
        settingsTitle: 'Quota badge',
        intro: 'Shows the current model’s balance or usage windows in the composer tool row, left of the model selector. Reads local credentials read-only — never asks for an API key.',
        refresh: 'Refresh interval (seconds)',
        refreshHint: '10–3600 seconds; switching models or clicking the reading refreshes immediately.',
        limitMode: 'Usage display',
        limitModeHint: 'Show usage windows as used or left. Balances are unaffected.',
        limitUsed: 'Used',
        limitLeft: 'Left',
        providers: 'Custom providers',
        providersHint: 'Matched by provider id. DeepSeek Account and the DeepSeek API work out of the box; a custom template wins over a built-in.',
        addProvider: 'Add provider',
        remove: 'Remove',
        enabled: 'Enabled',
        providerId: 'provider ids (comma separated)',
        label: 'Display name',
        url: 'Request URL',
        authType: 'Auth',
        credentialRefs: 'Credential refs (comma separated)',
        balanceLabel: 'Balance label',
        amountPath: 'Balance path',
        currencyPath: 'Currency path',
        currency: 'Fixed currency (optional)',
        windows: 'Usage windows',
        windowsPlaceholder: 'Weekly | subscription.weekly_usage_usd | subscription.weekly_limit_usd',
        timeoutMs: 'Timeout (ms)',
        test: 'Test',
        testing: 'Testing…',
        save: 'Save',
        saving: 'Saving…',
        saved: 'Saved',
        testOk: 'OK',
        testFail: 'Failed',
        saveFailed: 'Save failed',
        loadFailed: 'Could not read settings',
        privacy: 'Credentials are read inside the local Host process; the browser only receives labels, amounts, currencies, and percentages.',
      },
    }

    function readLocale(ctx) {
      try {
        const value = ctx.locale?.getLocale?.()
        const locale = typeof value === 'string' ? value : value?.locale
        if (typeof locale === 'string' && locale.toLowerCase().startsWith('zh')) return 'zh'
      } catch {
        /* ignore */
      }
      const nav = typeof navigator !== 'undefined' ? navigator.language : ''
      return nav && nav.toLowerCase().startsWith('zh') ? 'zh' : 'en'
    }

    function useStrings(ctx) {
      const [lang, setLang] = useState(() => readLocale(ctx))
      useEffect(() => {
        let off
        try {
          off = ctx.locale?.subscribe?.(() => setLang(readLocale(ctx)))
        } catch {
          off = undefined
        }
        return () => {
          if (typeof off === 'function') off()
        }
      }, [ctx])
      const dict = MESSAGES[lang] || MESSAGES.en
      const t = useCallback((key) => dict[key] ?? MESSAGES.en[key] ?? key, [dict])
      return { lang, t }
    }

    async function api(path, init) {
      const response = await fetch(API + path, {
        credentials: 'same-origin',
        cache: 'no-store',
        ...init,
      })
      const text = await response.text()
      let payload
      try {
        payload = JSON.parse(text)
      } catch {
        payload = undefined
      }
      if (!response.ok) {
        const message = payload && payload.message ? payload.message : `HTTP ${response.status}`
        const error = new Error(message)
        error.code = payload && payload.error
        throw error
      }
      return payload
    }

    /** Four settings fields the badge and the page share. */
    function normalizeSettings(payload) {
      return {
        refreshSeconds: Math.min(3600, Math.max(10, Number(payload?.refreshSeconds) || 60)),
        limitMode: payload?.limitMode === 'used' ? 'used' : 'left',
        providers: payload && typeof payload.providers === 'object' && payload.providers !== null ? payload.providers : {},
        display: payload && typeof payload.display === 'object' && payload.display !== null ? payload.display : {},
      }
    }

    const DEFAULT_SETTINGS = { refreshSeconds: 60, limitMode: 'left', providers: {}, display: {} }

    function useSettings() {
      const [settings, setSettings] = useState(DEFAULT_SETTINGS)
      useEffect(() => {
        let disposed = false
        const load = () => {
          api('settings')
            .then((payload) => {
              if (!disposed && payload) setSettings(normalizeSettings(payload))
            })
            .catch(() => {})
        }
        load()
        window.addEventListener(SETTINGS_EVENT, load)
        return () => {
          disposed = true
          window.removeEventListener(SETTINGS_EVENT, load)
        }
      }, [])
      return settings
    }

    /** Current provider/model from the session projection; null before one exists. */
    function useModelSelection(ctx, sessionId) {
      const [selection, setSelection] = useState(null)
      useEffect(() => {
        if (!sessionId) {
          setSelection(null)
          return undefined
        }
        let binding
        try {
          binding = ctx.sessions?.binding?.(sessionId)
        } catch {
          binding = undefined
        }
        if (!binding) {
          setSelection(null)
          return undefined
        }
        let face
        try {
          face = binding.session.projections.faceOf('modelSelection')
        } catch {
          face = undefined
        }
        if (!face) return undefined
        const read = () => {
          try {
            const snapshot = face.getSnapshot()
            const next = snapshot && snapshot.next ? snapshot.next : null
            setSelection(next && typeof next === 'object' ? { provider: next.provider, model: next.model } : null)
          } catch {
            setSelection(null)
          }
        }
        read()
        let off
        try {
          off = face.subscribe(read)
        } catch {
          off = undefined
        }
        return () => {
          if (typeof off === 'function') off()
        }
      }, [ctx, sessionId])
      return selection
    }

    /**
     * Poll the Host reading for one selection. A provider switch drops the
     * previous provider's cached reading instead of showing another model's
     * money, and a failed refresh keeps the last successful one for the same
     * provider so the reading dims instead of disappearing.
     */
    function useReading(selection, refreshSeconds) {
      const provider = selection?.provider || ''
      const model = selection?.model || ''
      const [state, setState] = useState({ status: 'loading' })
      const [tick, setTick] = useState(0)
      const lastGood = useRef(null)

      useEffect(() => {
        if (!provider) {
          setState({ status: 'loading' })
          return undefined
        }
        let disposed = false
        let controller
        let timer
        const interval = Math.min(3600, Math.max(10, Number(refreshSeconds) || 60)) * 1000
        const load = async (force) => {
          if (controller) controller.abort()
          controller = new AbortController()
          try {
            const query = new URLSearchParams({ provider })
            if (model) query.set('model', model)
            if (force) query.set('refresh', '1')
            const payload = await api(`status?${query.toString()}`, { signal: controller.signal })
            if (disposed) return
            if (payload && payload.status === 'ok' && payload.provider === provider) lastGood.current = payload
            setState(payload && typeof payload === 'object' ? payload : { status: 'error' })
          } catch (error) {
            if (disposed || error?.name === 'AbortError') return
            setState({ status: 'error', message: error?.message || String(error), provider })
          } finally {
            if (!disposed) timer = setTimeout(() => load(false), interval)
          }
        }
        void load(true)
        const onVisibility = () => {
          if (document.visibilityState === 'visible') void load(true)
        }
        document.addEventListener('visibilitychange', onVisibility)
        return () => {
          disposed = true
          if (controller) controller.abort()
          if (timer) clearTimeout(timer)
          document.removeEventListener('visibilitychange', onVisibility)
        }
      }, [provider, model, refreshSeconds, tick])

      return { state, cached: lastGood.current, reload: useCallback(() => setTick((value) => value + 1), []) }
    }

    function symbolFor(currency) {
      if (currency === 'CNY') return '¥'
      if (currency === 'USD') return '$'
      if (currency === 'EUR') return '€'
      return ''
    }

    function formatAmount(amount) {
      const numeric = Number(amount)
      if (!Number.isFinite(numeric)) return String(amount)
      return numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    // 100% and 0% are reserved for the real boundary: 99.58% used reads as 99%,
    // never "0% left" while a sliver of the window remains.
    function percentValue(percent, limitMode) {
      const clamped = Math.max(0, Math.min(100, Number(percent)))
      const used = Math.round(clamped)
      let shown = limitMode === 'left' ? 100 - used : used
      if (shown >= 100 && clamped > 0 && clamped < 100) shown = 99
      if (shown <= 0 && clamped > 0 && clamped < 100) shown = 1
      return `${shown}%`
    }

    /** Provider/model/time details for the tooltip and the accessible name. */
    function describe(status, t, lang) {
      const lines = []
      const name = status.displayName || status.provider || t('unknown')
      lines.push(name)
      for (const item of Array.isArray(status.items) ? status.items : []) {
        if (typeof item.percent === 'number') {
          lines.push(`${item.label} ${percentValue(item.percent, 'used')} ${t('usedSuffix')}`)
        } else if (item.amount !== undefined && item.amount !== null && item.amount !== '') {
          lines.push(`${item.label} ${symbolFor(item.currency)}${formatAmount(item.amount)}`.trim())
        }
      }
      if (status.updatedAt) {
        const date = new Date(status.updatedAt)
        if (!Number.isNaN(date.getTime())) {
          const pad = (n) => String(n).padStart(2, '0')
          lines.push(`${t('okUpdated')} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`)
        }
      }
      if (status.status !== 'ok') {
        const reason = t(status.status === 'no-credential' ? 'noCredential'
          : status.status === 'signed-out' ? 'signedOut'
            : status.status === 'unsupported' ? 'unsupported' : 'error')
        lines.push(reason)
      }
      if (lang === 'zh' && status.status === 'unsupported') lines.push(t('hint'))
      return lines.join('\n')
    }

    const badgeStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      flex: '0 0 auto',
      height: '28px',
      padding: '0 6px',
      border: 0,
      borderRadius: 'var(--dsw-radius-sm)',
      background: 'transparent',
      color: 'var(--dsw-alias-label-secondary)',
      fontFamily: 'inherit',
      fontSize: '12px',
      lineHeight: '20px',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
      cursor: 'pointer',
    }

    const dotStyle = { width: '5px', height: '5px', borderRadius: '50%', flex: '0 0 auto' }

    function severityOf(item) {
      if (!item || typeof item.percent !== 'number') return null
      const left = 100 - Math.max(0, Math.min(100, Number(item.percent)))
      if (left <= 10) return 'var(--dsw-alias-state-error-primary)'
      if (left <= 35) return 'var(--dsw-alias-state-warn-primary)'
      return null
    }

    function badgeText(item, limitMode, t, lang) {
      if (!item) return ''
      if (typeof item.percent === 'number') {
        const value = percentValue(item.percent, limitMode)
        const suffix = limitMode === 'left' ? t('leftSuffix') : t('usedSuffix')
        return lang === 'zh' ? `${item.label}${suffix} ${value}` : `${item.label} ${value} ${suffix}`
      }
      const value = `${symbolFor(item.currency)}${formatAmount(item.amount)}`
      return `${item.label} ${value}`.trim()
    }

    /** Pick the reading the badge shows: the stored override, or the tightest
     * window when the provider reports usage, otherwise the first balance. */
    function readingFor(items, display, limitMode, t, lang) {
      const amounts = items.filter((item) => typeof item.percent !== 'number')
      const windows = items.filter((item) => typeof item.percent === 'number')
      const tightest = windows.length > 0
        ? windows.reduce((worst, item) => (Number(item.percent) > Number(worst.percent) ? item : worst), windows[0])
        : null
      if (display === 'both' && tightest && amounts.length > 0) {
        const amount = `${symbolFor(amounts[0].currency)}${formatAmount(amounts[0].amount)}`
        return { text: `${amount} · ${badgeText(tightest, limitMode, t, lang)}`, item: tightest }
      }
      if (typeof display === 'string' && display.startsWith('amount:')) {
        const item = amounts[Number(display.slice(7))]
        if (item) return { text: badgeText(item, limitMode, t, lang), item }
      }
      if (typeof display === 'string' && display.startsWith('window:')) {
        const item = windows[Number(display.slice(7))]
        if (item) return { text: badgeText(item, limitMode, t, lang), item }
      }
      const fallback = tightest || amounts[0]
      return fallback
        ? { text: badgeText(fallback, limitMode, t, lang), item: fallback }
        : { text: '', item: null }
    }

    /** Menu entries for the current reading set, in reading order. */
    function menuOptions(items, limitMode, t, lang) {
      const options = [{ value: 'auto', label: t('menuAuto') }]
      items.forEach((item, index) => {
        if (typeof item.percent !== 'number') {
          options.push({ value: `amount:${index}`, label: badgeText(item, limitMode, t, lang) })
        }
      })
      items.forEach((item, index) => {
        if (typeof item.percent === 'number') {
          options.push({ value: `window:${index}`, label: badgeText(item, limitMode, t, lang) })
        }
      })
      const hasAmount = items.some((item) => typeof item.percent !== 'number')
      const hasWindow = items.some((item) => typeof item.percent === 'number')
      if (hasAmount && hasWindow) options.push({ value: 'both', label: t('menuBoth') })
      return options
    }

    const menuStyle = {
      position: 'fixed',
      zIndex: 1200,
      boxSizing: 'border-box',
      width: '220px',
      maxWidth: 'calc(100vw - 16px)',
      padding: '4px',
      borderRadius: '10px',
      border: '1px solid var(--dsw-alias-border-l1)',
      background: 'var(--dsw-alias-bg-overlay)',
      boxShadow: 'var(--dsw-elevation-panel)',
      color: 'var(--dsw-alias-label-primary)',
      fontSize: '12px',
    }

    const menuHeaderStyle = { padding: '4px 8px 6px', fontSize: '11px', color: 'var(--dsw-alias-label-secondary)' }
    const menuDividerStyle = { height: '1px', margin: '4px 2px', background: 'var(--dsw-alias-border-l1)' }
    const menuCheckStyle = { width: '12px', flex: '0 0 auto', color: 'var(--dsw-alias-brand-primary)' }

    function menuItemStyle(checked) {
      return {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        boxSizing: 'border-box',
        width: '100%',
        padding: '6px 8px',
        border: 0,
        borderRadius: '6px',
        background: checked ? 'var(--dsw-alias-interactive-bg-hover)' : 'transparent',
        color: 'var(--dsw-alias-label-primary)',
        font: 'inherit',
        textAlign: 'left',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }
    }

    /** Popover above the reading: pick which value shows, or refresh. */
    function ReadingMenu(props) {
      const { anchor, options, active, onChoose, onRefresh, onClose, t } = props
      const [rect, setRect] = useState(null)
      const menuRef = useRef(null)

      useEffect(() => {
        const update = () => {
          const node = anchor.current
          if (!node) return
          const box = node.getBoundingClientRect()
          setRect({ left: box.left, top: box.top })
        }
        update()
        window.addEventListener('resize', update)
        window.addEventListener('scroll', update, true)
        return () => {
          window.removeEventListener('resize', update)
          window.removeEventListener('scroll', update, true)
        }
      }, [anchor])

      useEffect(() => {
        const onPointer = (event) => {
          if (menuRef.current && menuRef.current.contains(event.target)) return
          if (anchor.current && anchor.current.contains(event.target)) return
          onClose()
        }
        const onKey = (event) => {
          if (event.key === 'Escape') onClose()
        }
        document.addEventListener('pointerdown', onPointer, true)
        document.addEventListener('keydown', onKey, true)
        return () => {
          document.removeEventListener('pointerdown', onPointer, true)
          document.removeEventListener('keydown', onKey, true)
        }
      }, [anchor, onClose])

      // Keyboard entry: opening from the badge moves focus into the menu; a
      // mouse click keeps the editor focused instead.
      useEffect(() => {
        if (typeof document === 'undefined' || document.activeElement !== anchor.current) return
        const node = menuRef.current
        if (!node) return
        const target = node.querySelector('[aria-checked="true"]') || node.querySelector('button')
        if (target && typeof target.focus === 'function') target.focus()
      }, [anchor])

      if (!rect) return null
      const width = 220
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
      const bottom = Math.max(8, window.innerHeight - rect.top + 8)

      return createPortal(
        h(
          'div',
          {
            ref: menuRef,
            role: 'menu',
            'aria-label': t('menuLabel'),
            style: { ...menuStyle, left: `${left}px`, bottom: `${bottom}px` },
            onMouseDown: (event) => event.preventDefault(),
          },
          h('div', { style: menuHeaderStyle }, t('menuLabel')),
          options.map((option) => h(
            'button',
            {
              key: option.value,
              type: 'button',
              role: 'menuitemradio',
              'aria-checked': option.value === active,
              style: menuItemStyle(option.value === active),
              onClick: () => onChoose(option.value),
            },
            h('span', { style: menuCheckStyle }, option.value === active ? '✓' : ''),
            h('span', { style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, option.label),
          )),
          h('div', { style: menuDividerStyle }),
          h(
            'button',
            { type: 'button', role: 'menuitem', style: menuItemStyle(false), onClick: onRefresh },
            h('span', { style: menuCheckStyle }, ''),
            h('span', null, t('menuRefresh')),
          ),
        ),
        document.body,
      )
    }

    function QuotaBadge(props) {
      const ctx = props.ctx
      const settings = useSettings()
      const { lang, t } = useStrings(ctx)
      const selection = useModelSelection(ctx, props.sessionId)
      const { state, cached, reload } = useReading(selection, settings.refreshSeconds)
      const [hover, setHover] = useState(false)
      const [focused, setFocused] = useState(false)
      const [menuOpen, setMenuOpen] = useState(false)
      const anchor = useRef(null)

      const provider = selection?.provider || ''
      const stored = (settings.display && settings.display[provider]) || 'auto'
      const fresh = state && state.status === 'ok' && state.provider === provider ? state : null
      const fallback = !fresh && cached && cached.provider === provider ? cached : null
      const view = fresh || fallback
      if (!view) return null
      const items = (Array.isArray(view.items) ? view.items : []).filter((item) =>
        item && (typeof item.percent === 'number'
          || (item.amount !== undefined && item.amount !== null && item.amount !== '')))
      if (items.length === 0) return null
      const options = menuOptions(items, settings.limitMode, t, lang)
      const active = options.some((option) => option.value === stored) ? stored : 'auto'
      const reading = readingFor(items, active, settings.limitMode, t, lang)
      if (reading.text === '') return null
      const stale = !fresh
      const severity = severityOf(reading.item)
      const title = describe(fresh || { ...fallback, status: 'error' }, t, lang)

      const choose = async (value) => {
        setMenuOpen(false)
        const display = { ...(settings.display || {}) }
        if (value === 'auto') delete display[provider]
        else display[provider] = value
        try {
          await api('settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              refreshSeconds: settings.refreshSeconds,
              limitMode: settings.limitMode,
              providers: settings.providers,
              display,
            }),
          })
          window.dispatchEvent(new CustomEvent(SETTINGS_EVENT))
        } catch {
          void reload()
        }
      }

      return h(
        React.Fragment,
        null,
        h(
          'button',
          {
            ref: anchor,
            type: 'button',
            'aria-haspopup': 'menu',
            'aria-expanded': menuOpen,
            style: {
              ...badgeStyle,
              background: hover || focused || menuOpen ? 'var(--dsw-alias-interactive-bg-hover)' : 'transparent',
              boxShadow: focused
                ? '0 0 0 2px var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary))'
                : 'none',
              opacity: stale ? 0.6 : 1,
            },
            title,
            'aria-label': title.replace(/\n/g, ' · '),
            onMouseEnter: () => setHover(true),
            onMouseLeave: () => setHover(false),
            onFocus: () => setFocused(true),
            onBlur: () => setFocused(false),
            onMouseDown: (event) => event.preventDefault(),
            onClick: () => setMenuOpen((open) => !open),
          },
          severity ? h('span', { key: 'severity', style: { ...dotStyle, background: severity } }) : null,
          reading.text,
        ),
        menuOpen
          ? h(ReadingMenu, {
              anchor,
              options,
              active,
              onChoose: (value) => { void choose(value) },
              onRefresh: () => { setMenuOpen(false); void reload() },
              onClose: () => setMenuOpen(false),
              t,
            })
          : null,
      )
    }

    const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '4px' }
    const labelStyle = { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' }
    const noteStyle = { fontSize: '11px', color: 'var(--dsw-alias-label-secondary)', margin: '2px 0 0' }
    const inputStyle = {
      width: '100%',
      boxSizing: 'border-box',
      padding: '6px 8px',
      fontSize: '12px',
      borderRadius: '6px',
      border: '1px solid var(--dsw-alias-border-l1)',
      background: 'var(--dsw-alias-bg-layer-2)',
      color: 'var(--dsw-alias-label-primary)',
    }
    const buttonStyle = {
      padding: '5px 12px',
      fontSize: '12px',
      borderRadius: '6px',
      border: '1px solid var(--dsw-alias-border-l1)',
      background: 'var(--dsw-alias-bg-layer-2)',
      color: 'var(--dsw-alias-label-primary)',
      cursor: 'pointer',
    }
    const primaryButtonStyle = { ...buttonStyle, background: 'var(--dsw-alias-brand-primary)', color: '#fff', borderColor: 'transparent' }
    const quietButtonStyle = { ...buttonStyle, background: 'transparent', borderColor: 'transparent', color: 'var(--dsw-alias-label-secondary)' }
    const cardStyle = {
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: '10px',
      marginBottom: '10px',
      background: 'var(--dsw-alias-bg-layer-1)',
      overflow: 'hidden',
    }
    const summaryStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '9px 12px',
      cursor: 'pointer',
      userSelect: 'none',
    }
    const bodyStyle = { padding: '4px 12px 12px', borderTop: '1px solid var(--dsw-alias-border-l1)' }
    const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '10px' }
    const sectionStyle = { marginBottom: '18px' }
    const headingStyle = { fontSize: '13px', fontWeight: 600, margin: '0 0 4px', color: 'var(--dsw-alias-label-primary)' }
    const tagStyle = {
      fontSize: '10px',
      lineHeight: '16px',
      padding: '0 6px',
      borderRadius: '999px',
      border: '1px solid var(--dsw-alias-border-l1)',
      color: 'var(--dsw-alias-label-secondary)',
    }
    const builtinRowStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '5px 0',
      fontSize: '12px',
      color: 'var(--dsw-alias-label-primary)',
    }

    function splitList(value) {
      return String(value || '')
        .split(/[\s,]+/)
        .map((part) => part.trim())
        .filter(Boolean)
    }

    function windowsToText(windows) {
      return (Array.isArray(windows) ? windows : [])
        .map((window) => `${window.label || 'Usage'} | ${window.usedPath || ''} | ${window.limitPath || ''}`)
        .join('\n')
    }

    function textToWindows(text) {
      return String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line !== '')
        .map((line) => {
          const [label, usedPath, limitPath] = line.split('|').map((part) => part.trim())
          return { label: label || 'Usage', usedPath, limitPath }
        })
    }

    function draftFromEntry(id, entry) {
      const template = (entry && entry.template) || {}
      const balance = template.extract && template.extract.balance ? template.extract.balance : {}
      return {
        id,
        enabled: !entry || entry.enabled !== false,
        label: template.label || id,
        providerIds: Array.isArray(template.match?.providerIds) ? template.match.providerIds.join(', ') : id,
        url: template.request?.url || '',
        authType: template.auth?.type || 'bearer',
        credentialRefs: Array.isArray(template.auth?.credentialRefs) ? template.auth.credentialRefs.join(', ') : '',
        balanceLabel: balance.label || '余额',
        amountPath: balance.amountPath || '',
        currencyPath: balance.currencyPath || '',
        currency: balance.currency || '',
        windows: windowsToText(template.extract?.windows),
        timeoutMs: template.timeoutMs || 10000,
      }
    }

    function entryFromDraft(draft) {
      const providerIds = splitList(draft.providerIds)
      const amountPath = String(draft.amountPath || '').trim()
      return {
        enabled: draft.enabled !== false,
        template: {
          id: draft.id,
          label: String(draft.label || '').trim() || draft.id,
          match: { providerIds: providerIds.length > 0 ? providerIds : [draft.id], baseURLPatterns: [] },
          request: {
            method: 'GET',
            url: String(draft.url || '').trim(),
            headers: {},
            body: null,
          },
          auth: {
            type: draft.authType,
            credentialRefs: splitList(draft.credentialRefs),
          },
          extract: {
            balance: amountPath === ''
              ? null
              : {
                  label: String(draft.balanceLabel || '').trim() || '余额',
                  amountPath,
                  currencyPath: String(draft.currencyPath || '').trim() || undefined,
                  currency: String(draft.currency || '').trim() || undefined,
                },
            windows: textToWindows(draft.windows).filter((window) => window.usedPath && window.limitPath),
          },
          timeoutMs: Math.min(30000, Math.max(1000, Number(draft.timeoutMs) || 10000)),
        },
      }
    }

    function Labeled(props) {
      return h('label', { style: fieldStyle }, h('span', { style: labelStyle }, props.label), props.children)
    }

    /** One custom provider: a summary row, and the fields only when expanded. */
    function ProviderCard(props) {
      const { draft, open, onToggle, onChange, onRemove, onTest, testing, result, t } = props
      const [advanced, setAdvanced] = useState(false)
      const set = (patch) => onChange({ ...draft, ...patch })
      const resultLine = result
        ? h('p', { style: { ...noteStyle, padding: '0 12px 8px' } }, result.status === 'ok'
            ? `${t('testOk')} · ${(result.items || []).map((item) => typeof item.percent === 'number'
                ? `${item.label} ${percentValue(item.percent, 'used')}%`
                : `${item.label} ${symbolFor(item.currency)}${formatAmount(item.amount)}`).join(' · ')}`
            : `${t('testFail')} · ${result.message || result.status}${result.httpStatus ? ` · HTTP ${result.httpStatus}` : ''}`)
        : null

      return h(
        'div',
        { style: cardStyle },
        h(
          'div',
          {
            style: summaryStyle,
            role: 'button',
            tabIndex: 0,
            onClick: onToggle,
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onToggle()
              }
            },
          },
          h('span', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, draft.label || draft.id || '…'),
          h('span', { style: noteStyle }, draft.providerIds || draft.id),
          draft.enabled === false ? h('span', { style: tagStyle }, t('disabledTag')) : null,
          h('span', { style: { flex: '1 1 auto' } }),
          h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, open ? `${t('collapseAction')} ▾` : `${t('editAction')} ▸`),
        ),
        resultLine,
        open
          ? h(
              'div',
              { style: bodyStyle },
              h(
                'div',
                { style: gridStyle },
                h(Labeled, { label: t('label') }, h('input', {
                  style: inputStyle,
                  value: draft.label,
                  onChange: (event) => set({ label: event.target.value }),
                })),
                h(Labeled, { label: t('url') }, h('input', {
                  style: inputStyle,
                  value: draft.url,
                  placeholder: 'https://example.com/v1/usage',
                  onChange: (event) => set({ url: event.target.value }),
                })),
              ),
              h(Labeled, { label: t('credentialRefs') }, h('input', {
                style: { ...inputStyle, marginTop: '10px' },
                value: draft.credentialRefs,
                placeholder: 'MY_API_KEY',
                onChange: (event) => set({ credentialRefs: event.target.value }),
              })),
              h(
                'div',
                { style: gridStyle },
                h(Labeled, { label: t('amountPath') }, h('input', {
                  style: inputStyle,
                  value: draft.amountPath,
                  placeholder: 'balance_infos[*].total_balance',
                  onChange: (event) => set({ amountPath: event.target.value }),
                })),
                h(Labeled, { label: t('windows') }, h('textarea', {
                  style: { ...inputStyle, minHeight: '58px', fontFamily: 'ui-monospace, monospace' },
                  placeholder: t('windowsPlaceholder'),
                  value: draft.windows,
                  onChange: (event) => set({ windows: event.target.value }),
                })),
              ),
              h('p', { style: noteStyle }, t('currencyAuto')),
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' } },
                h(
                  'label',
                  { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } },
                  h('input', {
                    type: 'checkbox',
                    checked: draft.enabled !== false,
                    style: { width: '14px', height: '14px', accentColor: 'var(--dsw-alias-brand-primary)' },
                    onChange: (event) => set({ enabled: event.target.checked }),
                  }),
                  t('enabled'),
                ),
                h('span', { style: { flex: '1 1 auto' } }),
                h('button', { type: 'button', style: quietButtonStyle, onClick: () => setAdvanced(!advanced) }, advanced ? t('hideAdvanced') : t('advanced')),
                h('button', { type: 'button', style: buttonStyle, disabled: Boolean(testing), onClick: onTest }, testing ? t('testing') : t('test')),
                h('button', { type: 'button', style: quietButtonStyle, onClick: onRemove }, t('remove')),
              ),
              advanced
                ? h(
                    'div',
                    { style: gridStyle },
                    h(Labeled, { label: t('providerId') }, h('input', {
                      style: inputStyle,
                      value: draft.providerIds,
                      onChange: (event) => set({ providerIds: event.target.value }),
                    })),
                    h(
                      Labeled,
                      { label: t('authType') },
                      h(
                        'select',
                        { style: inputStyle, value: draft.authType, onChange: (event) => set({ authType: event.target.value }) },
                        h('option', { value: 'bearer' }, 'Bearer'),
                        h('option', { value: 'x-api-key' }, 'x-api-key'),
                        h('option', { value: 'none' }, 'none'),
                      ),
                    ),
                    h(Labeled, { label: t('balanceLabel') }, h('input', {
                      style: inputStyle,
                      value: draft.balanceLabel,
                      onChange: (event) => set({ balanceLabel: event.target.value }),
                    })),
                    h(Labeled, { label: t('currencyPath') }, h('input', {
                      style: inputStyle,
                      value: draft.currencyPath,
                      placeholder: 'unit',
                      onChange: (event) => set({ currencyPath: event.target.value }),
                    })),
                    h(Labeled, { label: t('currency') }, h('input', {
                      style: inputStyle,
                      value: draft.currency,
                      placeholder: 'CNY',
                      onChange: (event) => set({ currency: event.target.value }),
                    })),
                    h(Labeled, { label: t('timeoutMs') }, h('input', {
                      type: 'number',
                      style: inputStyle,
                      value: draft.timeoutMs,
                      onChange: (event) => set({ timeoutMs: event.target.value }),
                    })),
                  )
                : null,
            )
          : null,
      )
    }

    function QuotaSettings(props) {
      const ctx = props.ctx
      const { t } = useStrings(ctx)
      const [loading, setLoading] = useState(true)
      const [error, setError] = useState('')
      const [refreshSeconds, setRefreshSeconds] = useState(60)
      const [limitMode, setLimitMode] = useState('left')
      const [display, setDisplay] = useState({})
      const [drafts, setDrafts] = useState([])
      const [probes, setProbes] = useState({})
      const [testing, setTesting] = useState({})
      const [open, setOpen] = useState({})
      const [saving, setSaving] = useState(false)
      const [savedAt, setSavedAt] = useState(0)
      const nextId = useRef(1)

      useEffect(() => {
        let disposed = false
        api('settings')
          .then((payload) => {
            if (disposed || !payload) return
            setRefreshSeconds(Number(payload.refreshSeconds) || 60)
            setLimitMode(payload.limitMode === 'used' ? 'used' : 'left')
            setDisplay(payload.display && typeof payload.display === 'object' ? payload.display : {})
            const providers = payload.providers && typeof payload.providers === 'object' ? payload.providers : {}
            setDrafts(Object.keys(providers).map((id) => draftFromEntry(id, providers[id])))
            setLoading(false)
          })
          .catch((err) => {
            if (disposed) return
            setError(err?.message || String(err))
            setLoading(false)
          })
        return () => {
          disposed = true
        }
      }, [])

      const addProvider = () => {
        const id = `custom-${nextId.current++}`
        setDrafts((now) => [...now, {
          id,
          enabled: true,
          label: id,
          providerIds: id,
          url: '',
          authType: 'bearer',
          credentialRefs: '',
          balanceLabel: '余额',
          amountPath: '',
          currencyPath: '',
          currency: '',
          windows: '',
          timeoutMs: 10000,
        }])
        setOpen((now) => ({ ...now, [id]: true }))
      }

      const test = useCallback(async (draft) => {
        setTesting((now) => ({ ...now, [draft.id]: true }))
        try {
          const entry = entryFromDraft(draft)
          const provider = splitList(draft.providerIds)[0] || draft.id
          const result = await api('probe', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ provider, template: entry.template }),
          })
          setProbes((now) => ({ ...now, [draft.id]: result }))
        } catch (err) {
          setProbes((now) => ({ ...now, [draft.id]: { status: 'error', message: err?.message || String(err) } }))
        } finally {
          setTesting((now) => ({ ...now, [draft.id]: false }))
        }
      }, [])

      const save = useCallback(async () => {
        setSaving(true)
        setError('')
        try {
          const providers = {}
          for (const draft of drafts) {
            const id = String(draft.id || '').trim()
            if (!id) continue
            providers[id] = entryFromDraft({ ...draft, id })
          }
          const payload = await api('settings', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ refreshSeconds: Number(refreshSeconds) || 60, limitMode, providers, display }),
          })
          if (payload && payload.settings) {
            setRefreshSeconds(Number(payload.settings.refreshSeconds) || 60)
            setLimitMode(payload.settings.limitMode === 'used' ? 'used' : 'left')
            setDisplay(payload.settings.display && typeof payload.settings.display === 'object' ? payload.settings.display : {})
            const next = payload.settings.providers && typeof payload.settings.providers === 'object'
              ? payload.settings.providers
              : {}
            setDrafts(Object.keys(next).map((id) => draftFromEntry(id, next[id])))
          }
          setSavedAt(Date.now())
          window.dispatchEvent(new CustomEvent(SETTINGS_EVENT))
        } catch (err) {
          setError(err?.message || String(err))
        } finally {
          setSaving(false)
        }
      }, [drafts, refreshSeconds, limitMode, display])

      if (loading) {
        return h('div', { style: { padding: '12px', fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, '…')
      }

      return h(
        'div',
        { style: { padding: '4px 2px 24px', maxWidth: '760px' } },
        h('h2', { style: { fontSize: '16px', margin: '0 0 4px', color: 'var(--dsw-alias-label-primary)' } }, t('settingsTitle')),
        h('p', { style: noteStyle }, t('intro')),

        h(
          'section',
          { style: { ...sectionStyle, marginTop: '16px' } },
          h('h3', { style: headingStyle }, t('globalTitle')),
          h(
            'div',
            { style: { ...gridStyle, marginTop: '6px' } },
            h(Labeled, { label: t('refresh') }, h('input', {
              type: 'number',
              min: 10,
              max: 3600,
              style: { ...inputStyle, width: '120px' },
              value: refreshSeconds,
              onChange: (event) => setRefreshSeconds(event.target.value),
            })),
            h(
              Labeled,
              { label: t('limitMode') },
              h(
                'select',
                { style: { ...inputStyle, width: '180px' }, value: limitMode, onChange: (event) => setLimitMode(event.target.value) },
                h('option', { value: 'left' }, t('limitLeft')),
                h('option', { value: 'used' }, t('limitUsed')),
              ),
            ),
          ),
        ),

        h(
          'section',
          { style: sectionStyle },
          h('h3', { style: headingStyle }, t('builtinTitle')),
          h('div', { style: builtinRowStyle },
            h('span', { style: { fontWeight: 600 } }, 'DeepSeek 账号'),
            h('span', { style: noteStyle }, t('builtinAccount')),
            h('span', { style: { flex: '1 1 auto' } }),
            h('span', { style: tagStyle }, t('builtinTag')),
          ),
          h('div', { style: builtinRowStyle },
            h('span', { style: { fontWeight: 600 } }, 'DeepSeek API'),
            h('span', { style: noteStyle }, t('builtinApi')),
            h('span', { style: { flex: '1 1 auto' } }),
            h('span', { style: tagStyle }, t('builtinTag')),
          ),
          h('p', { style: noteStyle }, t('builtinHint')),
        ),

        h(
          'section',
          { style: sectionStyle },
          h('h3', { style: headingStyle }, t('customTitle')),
          drafts.length === 0 ? h('p', { style: noteStyle }, t('emptyProviders')) : null,
          h(
            'div',
            { style: { marginTop: '8px' } },
            drafts.map((draft, index) => h(ProviderCard, {
              key: draft.id || index,
              draft,
              t,
              open: open[draft.id] === true,
              onToggle: () => setOpen((now) => ({ ...now, [draft.id]: !now[draft.id] })),
              onChange: (next) => setDrafts((now) => now.map((item, i) => (i === index ? next : item))),
              onRemove: () => setDrafts((now) => now.filter((_item, i) => i !== index)),
              onTest: () => void test(draft),
              testing: testing[draft.id],
              result: probes[draft.id],
            })),
          ),
          h('button', { type: 'button', style: buttonStyle, onClick: addProvider }, t('addProvider')),
        ),

        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '18px' } },
          h('button', { type: 'button', style: primaryButtonStyle, disabled: saving, onClick: () => void save() }, saving ? t('saving') : t('save')),
          savedAt ? h('span', { style: noteStyle }, t('saved')) : null,
          h('span', { style: { flex: '1 1 auto' } }),
          error ? h('span', { style: { ...noteStyle, color: 'var(--dsw-alias-state-error-primary)' } }, error) : null,
        ),
        h('p', { style: { ...noteStyle, marginTop: '10px' } }, t('privacy')),
      )
    }

    function withContext(Component, ctx) {
      return function ContextualComponent(props) {
        return h(Component, { ...props, ctx })
      }
    }

    function apply(ctx) {
      const Badge = withContext(QuotaBadge, ctx)
      const Settings = withContext(QuotaSettings, ctx)
      const navLabel = () => (readLocale(ctx) === 'zh' ? '额度徽标' : 'Quota badge')

      ctx.slots.inject(BADGE_SLOT, () =>
        ctx.slots.register(
          { name: BADGE_SLOT, id: 'dsh-quota-inline', order: 30, label: navLabel },
          Badge,
        ),
      )

      ctx.slots.inject(SETTINGS_SLOT, () =>
        ctx.slots.register(
          { name: SETTINGS_SLOT, id: 'dsh-quota-inline', order: 13, label: navLabel },
          Settings,
        ),
      )
    }

    return {
      inject: ['slots', 'sessions', 'locale'],
      apply,
    }
  },
})
