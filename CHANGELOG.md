# Changelog

Notable changes, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.1] — 2026-11-23

### Changed

- The README shows a real screenshot of the composer tool row instead of an
  ASCII sketch; the balance in it is an example value.

### Added

- `docs/badge.png`, referenced from `README.md` through a raw GitHub URL so npm
  and the plugin catalogs render it too.

## [0.1.0] — 2026-11-23

### Added

- Inline reading in `conversation.input.right`, immediately left of the model
  selector: one reading, ghost chrome, tooltip and `aria-label` with every
  value, click to refresh, keyboard focus.
- Built-in probes: `deepseek-account` (DSH account wallet and bonus) and
  `deepseek-official` / `deepseek-*` (API-key balance).
- Custom provider templates: provider id matching (globs allowed), URL, bearer /
  x-api-key / none auth, credential references, a balance path pair, and
  used/limit window pairs rendered as remaining percentages.
- A click menu on the reading: auto, a single balance, one usage window, or
  `balance + percentage`, remembered per provider in a `display` map.
- Settings page with refresh interval, used/left display, read-only built-in
  probes, and collapsible provider cards (advanced fields behind **Advanced**),
  plus a real Host-side **Test** button.
- Currency defaults to the response root's `currency` or `unit` field, so a
  custom template usually only needs the amount path.
- Host routes `GET /status`, `GET|POST /settings`, `POST /probe` under
  `/dsh-quota-inline/api/`; a 30-second per-provider cache invalidated by every
  finished model response and by settings writes.
- Node-side test suite for settings validation, path expansion, window
  percentages, extraction, template matching, and the client module wiring.
