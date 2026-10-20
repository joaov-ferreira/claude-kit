export type AgentStatus = 'running' | 'done' | 'failed'

export type AgentRun = {
  id: string
  agentId: string
  type: string
  description: string
  model: string
  effort?: string
  status: AgentStatus
  startedAt: number
  endedAt?: number
  /** Tokens da última requisição (janela de contexto em uso). */
  contextTokens: number
  /** Tokens acumulados: entrada não cacheada + escrita de cache + saída. */
  tokens: number
  steps: number
  /** Quantas vezes o agente foi retomado, a partir de 1. */
  round: number
  background: boolean
  isTeammate: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'agent-panel': {
      runs: AgentRun[]
      /** Relógio em ms; avança a cada segundo enquanto há agente rodando. */
      now: number
      showDone: boolean
      compact: boolean
      autoOpened: boolean
    }
  }
}
