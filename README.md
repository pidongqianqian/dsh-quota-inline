# dsh-quota-inline

[![npm version](https://img.shields.io/npm/v/dsh-quota-inline.svg)](https://www.npmjs.com/package/dsh-quota-inline)
[![license](https://img.shields.io/npm/l/dsh-quota-inline.svg)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-0.2.2--rc.3-4b5563)](https://github.com/deepseek-ai/DeepSeek-Harness)

One compact reading of the current model's balance or usage window, in the composer tool row, immediately left of the model selector.

![The reading in the composer tool row, immediately left of the model selector](https://raw.githubusercontent.com/pidongqianqian/dsh-quota-inline/main/docs/badge.png)

*The reading follows the model it sits next to; the amount above is an example value.*

It follows the session's model: switch to `deepseek-account` and the badge shows the wallet; switch to `deepseek-official` and it shows that API key's balance; point it at a relay that reports weekly or monthly limits and it shows the remaining percentage of the tightest window.

- **Small on purpose** — no strip, no panel: 12px text, a 28px hit area, ghost chrome borrowed from the model chip.
- **One reading, everything on hover** — the tooltip and the accessible name list every amount, every window, and the update time.
- **Click to pick the reading** — a small menu offers the balance, each usage window, or `balance + percentage`; the choice is remembered per provider, so a subscription route can show `$0.75 · 本周剩余 1%` next time you switch to it.
- **Read-only local credentials** — keys stay in the Host process; the browser receives labels, amounts, currencies, and percentages only.
- **Percentages, not just money** — a template can declare used/limit path pairs; the badge shows the remaining percentage when `Limit display` is `left`.
- **Fail-soft** — a failed refresh dims the last reading for the same provider instead of showing another provider's numbers or disappearing.

## Install

```sh
dsh plugin --profile desktop add dsh-quota-inline
```

Restart DeepSeek Harness once after installing (or reload the window) so the Host half and the client bundle both load.

Requires **DeepSeek Harness 0.2.2-rc.3 or newer**.

## Settings

Open **Settings → Quota badge**:

1. **Refresh interval** — idle refresh in seconds (10–3600). Switching models or clicking the reading refreshes immediately.
2. **Usage display** — show usage windows as `left` (default) or `used`; balances are unaffected.
   The reading itself is picked from the badge menu (click the reading): auto, a single balance, one window, or `balance + percentage`. The choice is stored per provider under `display` in the settings file.
3. **Custom providers** — cards stay collapsed; expand one to edit its name, URL, credential references, balance path, and windows (one per line: `label | usedPath | limitPath`). Provider id, auth style, currency paths, and timeout live under **Advanced**. **Test** performs one real request from the Host and shows the extracted values.

DeepSeek Account and the DeepSeek API need no configuration; they are listed as read-only built-ins.

Settings live in `$DSH_HOME/dsh-quota-inline/settings.json` (`~/.dsh/dsh-quota-inline/settings.json`).

## Built-in probes

| Provider id | Reading | Endpoint |
|---|---|---|
| `deepseek-account` | Wallet balance + bonus | DSH account service (OAuth) |
| `deepseek-official` (and `deepseek-*`) | API-key balance | `GET https://api.deepseek.com/user/balance` |

A custom template with the same provider id wins over the built-in probe.

### Template example

A relay that exposes a DeepSeek-compatible balance and weekly/monthly USD windows:

```json
{
  "label": "My relay",
  "match": { "providerIds": ["my-relay"] },
  "request": { "method": "GET", "url": "https://relay.example.com/v1/usage" },
  "auth": { "type": "bearer", "credentialRefs": ["MY_RELAY_API_KEY"] },
  "extract": {
    "balance": { "label": "余额", "amountPath": "remaining", "currencyPath": "unit" },
    "windows": [
      { "label": "本周", "usedPath": "subscription.weekly_usage_usd", "limitPath": "subscription.weekly_limit_usd" },
      { "label": "本月", "usedPath": "subscription.monthly_usage_usd", "limitPath": "subscription.monthly_limit_usd" }
    ]
  }
}
```

Paths use dots, `[n]` for one array element, and `[*]` to expand every element (used by `balance_infos[*]`). A window needs both numbers; a window the response omits is simply not shown.

## Privacy

Credentials are resolved through the DSH `credentials` service (read-only) inside the Host process. They are never written to logs, never returned to the browser, and never sent anywhere except the provider URL you configured. No telemetry.

## Limitations

- The badge shows exactly one reading; the rest live in the tooltip. That is the point of the placement.
- A provider without a matching template renders nothing, and a failed query keeps the last good reading dimmed — the settings page's **Test** is the place to diagnose.
- `limitMode: left` renders `100 − used` so the two modes always add up to 100%.

## 中文说明

输入框工具栏、模型选择器左侧的一行读数：显示当前模型的余额，或订阅窗口的剩余百分比。

- 跟随当前会话选择的模型；切到 `deepseek-account` 显示账号钱包，切到 `deepseek-official` 显示该 API Key 的余额。
- 限额窗口按 `已用 / 总量` 计算百分比，默认显示**剩余**；悬停或键盘聚焦可看到全部读数与更新时间，点击立即刷新。
- 只读访问本机 DSH 凭证，密钥不出 Host 进程；浏览器只收到标签、金额、币种和百分比。
- 点读数弹出小菜单：自动 / 余额 / 某个窗口 / 余额 + 百分比；每个供应商单独记住，切模型后自动恢复。
- 设置页默认只显示刷新间隔、限额显示和内置查询；自定义供应商平时收起，点开才露出 URL、凭证引用、余额路径和限额窗口，provider id / 鉴权方式 / 币种 / 超时收在「高级」里。**测试**按钮会由 Host 发一次真实请求。

## License

MIT © 2026 pidongqianqian. See [LICENSE](LICENSE).
