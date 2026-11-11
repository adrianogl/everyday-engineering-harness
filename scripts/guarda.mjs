#!/usr/bin/env node
import { readFileSync } from 'node:fs'

function lerStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return null
  }
}

async function main() {
  const entrada = lerStdin()
  const comando = entrada?.tool_input?.command
  if (typeof comando !== 'string') return
  const { avaliar } = await import('./lib/guarda.mjs')
  const { decisao, motivo } = avaliar(comando)
  if (decisao !== 'ask') return
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: motivo },
    }),
  )
}

try {
  await main()
} catch {
}
process.exit(0)
