import type { AgentRun } from '../types'

export const fmtTokens = (n: number): string => {
  if (n < 1000) return String(Math.round(n))
  if (n < 1_000_000) return (n / 1000).toFixed(n < 10_000 ? 1 : 0) + 'k'
  return (n / 1_000_000).toFixed(1) + 'M'
}

export const fmtDuration = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`
}

export const shortModel = (model: string): string =>
  model.replace(/^claude-/, '').replace(/-\d{8}$/, '')

export const truncate = (text: string, max: number): string =>
  text.length > max ? text.slice(0, Math.max(0, max - 1)) + '…' : text

export const escapeXml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const PALETTE = ['#3b82f6', '#a855f7', '#14b8a6', '#f59e0b', '#ec4899', '#22c55e', '#06b6d4', '#ef4444']

/** Cor estável por tipo de agente (hash djb2 do subagentType). */
export const colorFor = (type: string): string => {
  let h = 5381
  for (let i = 0; i < type.length; i++) h = ((h << 5) + h + type.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]!
}

export const elapsed = (run: AgentRun, now: number): number =>
  (run.endedAt ?? now) - run.startedAt

export const STATUS_LABEL = { running: 'rodando', done: 'concluído', failed: 'falhou' } as const
export const STATUS_MARK = { running: '●', done: '✓', failed: '✕' } as const
export const STATUS_COLOR = { running: '#3b82f6', done: '#22c55e', failed: '#ef4444' } as const
