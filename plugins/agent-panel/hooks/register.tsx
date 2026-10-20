import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { AgentRun } from '../types'
import {
  STATUS_COLOR,
  STATUS_MARK,
  elapsed,
  fmtDuration,
  fmtTokens,
  shortModel,
  truncate,
} from './format'
import { applyComplete, applySpawn, applyStep, sortRuns } from './runs'
import { cardHeight, cardSvg, headerSvg } from './svg'

const PANE = 'agent-panel'
const TITLE = 'Agentes'
const runsAtom = atom({ plugin: 'agent-panel', key: 'runs' } as const, [] as AgentRun[])
const nowAtom = atom({ plugin: 'agent-panel', key: 'now' } as const, 0)
const showDoneAtom = atom({ plugin: 'agent-panel', key: 'showDone' } as const, true)
const compactAtom = atom({ plugin: 'agent-panel', key: 'compact' } as const, false)
const autoOpenedAtom = atom({ plugin: 'agent-panel', key: 'autoOpened' } as const, false)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'agent-panel',
      description: 'Mostra ou esconde o painel de subagentes',
    })
    await update($, nowAtom, () => 0)
    $.clock.every(1000, async () => {
      const runs = await read($, runsAtom)
      if (runs.some(r => r.status === 'running')) {
        await update($, nowAtom, () => Date.now())
      }
    })

    return next(e)
  })

  on('command.run', { command: 'agent-panel' }, async $ => {
    const open = (await $.ui.panes()).some(p => p.id === PANE)
    if (open) {
      await $.ui.close({ id: PANE })
      return { text: 'Painel de agentes fechado.' }
    }
    await $.ui.open({ id: PANE, title: TITLE })
    return { text: 'Painel de agentes aberto.' }
  })

  on('agent.spawn', async ($, e, next) => {
    const result = await next(e)
    const agentId = 'deny' in result ? undefined : (e.resume?.agentId ?? result.agentId)
    if ('deny' in result || !agentId) return result
    const now = await $.clock.now()
    await update($, nowAtom, () => now)
    await update($, runsAtom, runs =>
      applySpawn(
        runs,
        {
          agentId,
          type: e.subagentType,
          description: e.description || e.name || '',
          model: result.model,
          background: e.background,
          isTeammate: e.isTeammate === true,
          resume: e.resume !== undefined,
        },
        now,
      ),
    )
    if (!(await read($, autoOpenedAtom))) {
      await update($, autoOpenedAtom, () => true)
      void $.ui.open({ id: PANE, title: TITLE })
    }

    return result
  })

  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    const agentId = e.agentId
    if (agentId && result.usage) {
      const u = result.usage
      const now = await $.clock.now()
      await update($, runsAtom, runs =>
        applyStep(
          runs,
          {
            agentId,
            model: u.model,
            effort: e.effort === undefined ? undefined : String(e.effort),
            contextTokens:
              u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens,
            tokens: u.input_tokens + u.cache_creation_input_tokens + u.output_tokens,
          },
          now,
        ),
      )
    }

    return result
  })

  on('turn.complete', async ($, e, next) => {
    const agentId = e.agentId
    if (agentId) {
      const now = await $.clock.now()
      await update($, nowAtom, () => now)
      await update($, runsAtom, runs => applyComplete(runs, agentId, e.reason, now))
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const els = $.ui.resolve(e)
    const { Box, Text, Button } = els
    const Svg = 'Svg' in els ? els.Svg : undefined
    const runs = sortRuns(await read($, runsAtom))
    const stored = await read($, nowAtom)
    const now = stored || (await $.clock.now())
    const showDone = await read($, showDoneAtom)
    const compact = await read($, compactAtom)
    const running = runs.filter(r => r.status === 'running')
    const finished = runs.filter(r => r.status !== 'running')

    const toggles = (
      <Box flexDirection="row" gap={1}>
        <Button
          label={compact ? 'Modo normal' : 'Modo compacto'}
          onPress={() => update($, compactAtom, v => !v)}
        />
      </Box>
    )

    if (runs.length === 0) {
      return <Text dimColor>Nenhum subagente nesta sessão ainda.</Text>
    }

    const textRow = (r: AgentRun) => (
      <Box flexDirection="column">
        <Text color={STATUS_COLOR[r.status]}>
          {STATUS_MARK[r.status]} {truncate(r.description || r.type, 40)}
        </Text>
        <Text dimColor>
          {'  '}
          {r.type} · {shortModel(r.model)} · ctx {fmtTokens(r.contextTokens)} · tok{' '}
          {fmtTokens(r.tokens)} · {r.steps} req · {fmtDuration(elapsed(r, now))}
        </Text>
      </Box>
    )

    const card = (r: AgentRun) =>
      Svg ? (
        <Svg
          key={r.agentId}
          source={cardSvg(r, now, compact)}
          alt={`${r.description || r.type}: ${r.status}`}
          height={cardHeight(compact)}
        />
      ) : (
        textRow(r)
      )

    return (
      <Box flexDirection="column" gap={1}>
        {Svg ? (
          <Svg source={headerSvg(runs, now)} alt={`${running.length} de ${runs.length} agentes rodando`} height={48} />
        ) : (
          <Text bold>
            {running.length}/{runs.length} agentes · {fmtTokens(runs.reduce((s, r) => s + r.tokens, 0))}{' '}
            tokens
          </Text>
        )}
        {running.map(card)}
        {finished.length > 0 && (
          <Box flexDirection="column" gap={1}>
            <Button
              label={`${showDone ? '▾' : '▸'} Concluídos (${finished.length})`}
              onPress={() => update($, showDoneAtom, v => !v)}
            />
            {showDone && finished.map(card)}
          </Box>
        )}
        {toggles}
      </Box>
    )
  })
}
