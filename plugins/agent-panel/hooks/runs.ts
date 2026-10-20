import type { AgentRun } from '../types'

export type SpawnInfo = {
  agentId: string
  type: string
  description: string
  model: string
  background: boolean
  isTeammate: boolean
  resume: boolean
}

export type StepInfo = {
  agentId: string
  model: string
  effort?: string
  contextTokens: number
  tokens: number
}

const blank = (agentId: string, now: number): AgentRun => ({
  id: agentId,
  agentId,
  type: 'agente',
  description: '',
  model: '',
  status: 'running',
  startedAt: now,
  contextTokens: 0,
  tokens: 0,
  steps: 0,
  round: 1,
  background: false,
  isTeammate: false,
})

const patch = (
  runs: readonly AgentRun[],
  agentId: string,
  now: number,
  fn: (run: AgentRun) => AgentRun,
): AgentRun[] => {
  const found = runs.some(r => r.agentId === agentId)
  const base = found ? runs : [...runs, blank(agentId, now)]
  return base.map(r => (r.agentId === agentId ? fn(r) : r))
}

/** Cria a linha do agente; um resume volta a mesma linha a 'running', rodada +1. */
export const applySpawn = (runs: readonly AgentRun[], s: SpawnInfo, now: number): AgentRun[] =>
  patch(runs, s.agentId, now, r => {
    const resumed = r.endedAt !== undefined
    return {
      ...r,
      type: s.type,
      description: s.description || r.description,
      model: s.model || r.model,
      background: s.background,
      isTeammate: s.isTeammate,
      status: 'running',
      endedAt: undefined,
      round: resumed ? r.round + 1 : r.round,
      startedAt: resumed ? now : r.startedAt,
    }
  })

export const applyStep = (runs: readonly AgentRun[], s: StepInfo, now: number): AgentRun[] =>
  patch(runs, s.agentId, now, r => ({
    ...r,
    model: s.model || r.model,
    effort: s.effort ?? r.effort,
    contextTokens: s.contextTokens || r.contextTokens,
    tokens: r.tokens + s.tokens,
    steps: r.steps + 1,
  }))

/** reason 'answer' = concluído; qualquer outro = falhou. */
export const applyComplete = (
  runs: readonly AgentRun[],
  agentId: string,
  reason: string,
  now: number,
): AgentRun[] =>
  runs.map(r =>
    r.agentId === agentId
      ? { ...r, status: reason === 'answer' ? 'done' : 'failed', endedAt: now }
      : r,
  )

export const sortRuns = (runs: readonly AgentRun[]): AgentRun[] =>
  [...runs].sort((a, b) => a.startedAt - b.startedAt)
