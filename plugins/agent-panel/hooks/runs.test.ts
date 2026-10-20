import { expect, test } from 'claude-code/testing'

import { applyComplete, applySpawn, applyStep } from './runs'
import { fmtDuration, fmtTokens } from './format'
import { costumeOf } from './crab'
import { cardSvg } from './svg'

const spawn = { agentId: 'a1', type: 'Explore', description: 'Busca', model: 'claude-haiku-5-5', background: false, isTeammate: false, resume: false }

test('spawn, step e complete', async () => {
  let runs = applySpawn([], spawn, 1000)
  runs = applyStep(runs, { agentId: 'a1', model: 'm', contextTokens: 500, tokens: 700 }, 1100)
  runs = applyStep(runs, { agentId: 'a1', model: 'm', contextTokens: 900, tokens: 300 }, 1200)
  expect(runs[0]!.steps).toBe(2)
  expect(runs[0]!.tokens).toBe(1000)
  expect(runs[0]!.contextTokens).toBe(900)
  expect(applyComplete(runs, 'a1', 'answer', 2000)[0]!.status).toBe('done')
  expect(applyComplete(runs, 'a1', 'error', 2000)[0]!.status).toBe('failed')
})

test('resume volta a running com rodada + 1', async () => {
  let runs = applySpawn([], spawn, 1000)
  runs = applyComplete(runs, 'a1', 'answer', 2000)
  runs = applySpawn(runs, { ...spawn, resume: true }, 3000)
  expect(runs).toHaveLength(1)
  expect(runs[0]!.status).toBe('running')
  expect(runs[0]!.round).toBe(2)
})

test('formatação e svg', async () => {
  expect(fmtTokens(1234)).toBe('1.2k')
  expect(fmtDuration(65000)).toBe('1:05')
  const svg = cardSvg(applySpawn([], { ...spawn, description: 'a<b&c' }, 0)[0]!, 5000, false)
  expect(svg).toContain('a&lt;b&amp;c')
})

test('fantasia estável por tipo', async () => {
  expect(costumeOf('Explore')).toBe('explore')
  expect(costumeOf('meu-agente')).toBe(costumeOf('meu-agente'))
})

test('spawn sobre agente terminado conta como retomada, mesmo sem flag', async () => {
  let runs = applySpawn([], spawn, 1000)
  runs = applyComplete(runs, 'a1', 'error', 2000)
  runs = applySpawn(runs, spawn, 3000)
  expect(runs[0]!.round).toBe(2)
  expect(runs[0]!.startedAt).toBe(3000)
})

test('complete de agente desconhecido não cria linha', async () => {
  expect(applyComplete([], 'zz', 'answer', 1)).toHaveLength(0)
})
