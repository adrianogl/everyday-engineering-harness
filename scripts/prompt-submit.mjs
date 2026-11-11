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
  if (!entrada || typeof entrada.prompt !== 'string') return
  const { loadPerfil } = await import('./lib/perfil.mjs')
  const { pastaRegistros, registrosDoPrompt } = await import('./lib/registros.mjs')
  const cwd = typeof entrada.cwd === 'string' && entrada.cwd ? entrada.cwd : process.env.CLAUDE_PROJECT_DIR || process.cwd()
  const base = pastaRegistros({ perfil: loadPerfil().perfil, cwd })
  const contexto = registrosDoPrompt({ prompt: entrada.prompt, base })
  if (!contexto) return
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: contexto } }))
}

try {
  await main()
} catch {
}
process.exit(0)
