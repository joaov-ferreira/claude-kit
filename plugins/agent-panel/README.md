# agent-panel

A Claude Code mod: a live panel of the session's subagents. It works on its own, with no skill: any subagent (Agent tool, workflows, teammates) is picked up from the lifecycle hooks (`agent.spawn`, `turn.step`, `turn.complete`).

- **Command**: `/agent-panel` toggles the panel. It also opens by itself when the first subagent starts.
- **Cards**: description, type · model · effort, context, tokens, requests and time, with a status mark. Finished agents go to a "Concluídos" section; a button switches to compact rows. The terminal gets a text fallback.
- **Crab**: each card has the pixel Clawd, one costume per subagent type (`Explore` the pirate, `Plan` the detective, `general-purpose` the chef, ...; other types get a stable costume by name). It walks while the agent runs and dims when done. `prefers-reduced-motion` stops it.
- **Cost**: not shown. The engine reports tokens, not money.

Texts are in Portuguese. The crab sprite is adapted from [savvy-progress](../savvy-progress) (MIT), itself from DockCrab (Clawdy).

```bash
claude --plugin-dir ~/claude-kit/plugins/agent-panel
```
