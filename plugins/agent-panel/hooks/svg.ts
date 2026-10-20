import type { AgentRun } from '../types'
import { CRAB_CSS, costumeOf, crab } from './crab'
import {
  STATUS_COLOR,
  STATUS_LABEL,
  STATUS_MARK,
  colorFor,
  elapsed,
  escapeXml,
  fmtDuration,
  fmtTokens,
  shortModel,
  truncate,
} from './format'

export const WIDTH = 320

const STYLE = `<style>
.bg{fill:rgba(128,128,128,.14)}
.t{fill:#1f2328;font:600 13px -apple-system,system-ui,sans-serif}
.s{fill:#57606a;font:11px -apple-system,system-ui,sans-serif}
.m{fill:#57606a;font:11px ui-monospace,Menlo,monospace}
.big{fill:#1f2328;font:600 16px ui-monospace,Menlo,monospace}
@media (prefers-color-scheme:dark){.t,.big{fill:#e6edf3}.s,.m{fill:#9198a1}}
</style>`

const wrap = (height: number, body: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" width="${WIDTH}" height="${height}">${STYLE}${CRAB_CSS}${body}</svg>`

export const cardHeight = (compact: boolean): number => (compact ? 30 : 66)

export const cardSvg = (run: AgentRun, now: number, compact: boolean): string => {
  const h = cardHeight(compact)
  const color = colorFor(run.type)
  const sc = STATUS_COLOR[run.status]
  const mark = `${STATUS_MARK[run.status]} ${STATUS_LABEL[run.status]}`
  const time = fmtDuration(elapsed(run, now))
  const bar = `<rect class="bg" x="0" y="0" width="${WIDTH}" height="${h}" rx="8"/><rect x="0" y="0" width="4" height="${h}" rx="2" fill="${color}"/>`
  const status = `<text x="${WIDTH - 10}" y="19" text-anchor="end" font-size="11" font-family="-apple-system,system-ui,sans-serif" fill="${sc}">${escapeXml(mark)}</text>`
  const title = run.description || run.type
  const costume = costumeOf(run.type)
  const walking = run.status === 'running'
  const dim = run.status !== 'running'
  if (compact) {
    return wrap(
      h,
      `${bar}${crab(10, 5, costume, dim, walking, 0.7)}<text class="t" x="38" y="19">${escapeXml(truncate(title, 18))}</text>` +
        `<text class="m" x="${WIDTH - 90}" y="19" text-anchor="end">${time}</text>${status}`,
    )
  }
  const round = run.round > 1 ? ` · rodada ${run.round}` : ''
  const sub = [run.type, shortModel(run.model), run.effort].filter(Boolean).join(' · ') + round
  const metrics =
    `ctx ${fmtTokens(run.contextTokens)} · tok ${fmtTokens(run.tokens)} · ` +
    `${run.steps} req · ${time}`
  return wrap(
    h,
    `${bar}${crab(12, 19, costume, dim, walking, 1)}<text class="t" x="52" y="21">${escapeXml(truncate(title, 22))}</text>${status}` +
      `<text class="s" x="52" y="39">${escapeXml(truncate(sub, 42))}</text>` +
      `<text class="m" x="52" y="56">${escapeXml(truncate(metrics, 38))}</text>`,
  )
}

export const headerSvg = (runs: readonly AgentRun[], now: number): string => {
  const running = runs.filter(r => r.status === 'running').length
  const tokens = runs.reduce((sum, r) => sum + r.tokens, 0)
  const first = runs.reduce((min, r) => Math.min(min, r.startedAt), now)
  const tiles = [
    { label: 'agentes', value: `${running}/${runs.length}` },
    { label: 'tokens', value: fmtTokens(tokens) },
    { label: 'tempo', value: fmtDuration(runs.length ? now - first : 0) },
  ]
  const w = (WIDTH - 16) / 3
  const body = tiles
    .map((t, i) => {
      const x = i * (w + 8)
      return (
        `<rect class="bg" x="${x}" y="0" width="${w}" height="48" rx="8"/>` +
        `<text class="big" x="${x + 10}" y="27">${escapeXml(t.value)}</text>` +
        `<text class="s" x="${x + 10}" y="41">${t.label}</text>`
      )
    })
    .join('')
  return wrap(48, body)
}
