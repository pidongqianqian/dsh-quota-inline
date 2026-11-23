# Architecture

## Boundary

```
DSH Web page (browser)
  conversation.input.right      settings.section
  └─ QuotaBadge ── GET /dsh-quota-inline/api/status
                  POST /settings, POST /probe        └─ QuotaSettings
        holds labels/amounts/currencies/percents; never a credential
                              │ same-origin HTTP (loopback)
DSH Host (index.js)
  routes → computeStatus → template match → ctx.credentials.resolve → fetch
  ↘ ctx.deepseekAccount.getBalance() for the account probe
  settings: $DSH_HOME/dsh-quota-inline/settings.json (atomic write)
```

## Routes

| Route | Method | Purpose |
|---|---|---|
| `/dsh-quota-inline/api/status` | GET | Reading for `?provider=&model=`; `refresh=1` bypasses the 30 s cache |
| `/dsh-quota-inline/api/settings` | GET / POST | Read or replace the full settings object |
| `/dsh-quota-inline/api/probe` | POST | One real request for the settings page's Test button |

POST routes require `content-type: application/json` and, when an `Origin`
header is present, the Web server's own origin.

## Status payload

```json
{
  "status": "ok | no-credential | signed-out | unsupported | error",
  "provider": "my-relay",
  "displayName": "My relay",
  "model": "deepseek-flash",
  "items": [
    { "label": "余额", "amount": "8.293", "currency": "USD" },
    { "label": "本周", "percent": 23.4, "used": 20.6, "limit": 88 }
  ],
  "refreshSeconds": 60,
  "updatedAt": "2026-11-22T02:00:00.000Z"
}
```

`percent` is the **used** percentage; the badge renders `100 − percent` when
`limitMode` is `left`. Items are never mixed across providers: the badge only
accepts a payload whose `provider` equals the current selection and keeps the
last good payload per provider for a dimmed stale reading.

## Template model

```js
{
  label: 'My relay',
  match: { providerIds: ['my-relay'] },       // globs allowed
  request: { method: 'GET', url: 'https://…', headers: {}, body: null },
  auth: { type: 'bearer', credentialRefs: ['MY_RELAY_API_KEY'] },
  extract: {
    balance: { label: '余额', amountPath: 'balance_infos[*].total_balance',
               currencyPath: 'balance_infos[*].currency', currency: 'CNY' },
    windows: [{ label: '本周', usedPath: 'subscription.weekly_usage_usd',
                limitPath: 'subscription.weekly_limit_usd' }],
  },
  timeoutMs: 10000,
}
```

Paths support `.key`, `[n]`, and `[*]` (array expansion). A balance path may
yield several values (one item each, paired with the currency at the same
index); a window needs both numbers and is skipped otherwise.

## Settings

```json
{
  "version": 1,
  "refreshSeconds": 60,
  "limitMode": "left",
  "providers": { "<id>": { "enabled": true, "template": {} } },
  "display": { "<provider id>": "auto | both | amount:<n> | window:<n>" }
}
```

`display` is keyed by **provider id** (not template id) so built-ins can carry an
override too: `amount:0` is the first balance in the response, `window:1` the
second usage window, `both` joins the first balance with the tightest window.
Unknown keys or values are dropped by `sanitizeSettings()` instead of failing
the save. The badge menu writes this map; the settings page preserves it.

`sanitizeSettings()` rebuilds defaults, clamps `refreshSeconds` to 10–3600,
accepts only `used | left`, validates every provider id and template, and is
the single write path for `$DSH_HOME/dsh-quota-inline/settings.json`.

## Refresh

The client polls every `refreshSeconds`, forces a refresh on model switch,
page visibility, the menu's **Refresh** entry, and a
`dsh-quota-inline:settings-changed` window event.
The Host caches a successful reading for 30 seconds per provider and drops the
cache when a model response lands (`session/event` → `assistant/message`) or
settings are saved. The hidden seat never exists: only one registration, in the
composer tool row.

## Privacy

Keys are resolved per request through `ctx.credentials.resolve()` (read-only)
and used only to build the outgoing request. The response body is capped at
512 KiB and never leaves the Host except as the extracted, label/value items
above; the probe route returns a 600-character sample for template debugging.
