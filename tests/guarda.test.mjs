import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { avaliar } from '../scripts/lib/guarda.mjs'

const hook = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts/guarda.mjs')

const pedem = [
  'rm -rf /',
  'rm -rf ~',
  'rm -rf $HOME',
  'rm -rf "$HOME"',
  'rm -rf *',
  'rm -r -f /',
  'rm --recursive --force /',
  'sudo rm -rf /',
  'cd x && rm -rf /',
  'ls; rm -rf ~',
  'echo ok | rm -rf *',
  'ls\n  rm   -rf    /',
  'bash -c "rm -rf /"',
  'git push --force',
  'git push -f origin x',
  'git push origin +main',
  'git push --force-with-lease',
  'git -C repo push --force',
  'git reset --hard',
  'git reset --hard HEAD~3',
  'git clean -fd',
  'git clean -f',
  'psql -c "DROP TABLE x"',
  'psql -c "drop table x"',
  'psql -c "TRUNCATE orders"',
  'psql -d db -c "truncate table orders"',
  'docker exec db psql -U u -c "drop database prod"',
  'mysql -e "DROP SCHEMA s"',
]

const permitidos = [
  'rm -rf node_modules',
  'rm -rf dist',
  'rm -rf ./build',
  'rm file.txt',
  'git push',
  'git push -u origin feat/x',
  'git push origin feat/x',
  'git status',
  'git reset --soft HEAD~1',
  'git clean -n',
  'git commit -m "fix: git push --force"',
  'grep -r "DROP TABLE" .',
  'rg -i "truncate" src',
  'cat migrations/001.sql',
  'echo "git push --force"',
  'echo "rm -rf /"',
  'psql -c "select * from x"',
  'ls -la && npm test',
  '',
]

for (const comando of pedem) {
  test(`pede confirmação: ${JSON.stringify(comando)}`, () => {
    const r = avaliar(comando)
    assert.equal(r.decisao, 'ask')
    assert.ok(r.motivo)
  })
}

for (const comando of permitidos) {
  test(`permite: ${JSON.stringify(comando)}`, () => {
    assert.deepEqual(avaliar(comando), { decisao: 'allow' })
  })
}

function rodar(entrada) {
  return spawnSync('node', [hook], { input: typeof entrada === 'string' ? entrada : JSON.stringify(entrada), encoding: 'utf8' })
}

test('CLI imprime ask com o motivo para comando destrutivo', () => {
  const r = rodar({ tool_name: 'Bash', tool_input: { command: 'git push --force' } })
  assert.equal(r.status, 0)
  const saida = JSON.parse(r.stdout).hookSpecificOutput
  assert.equal(saida.hookEventName, 'PreToolUse')
  assert.equal(saida.permissionDecision, 'ask')
  assert.match(saida.permissionDecisionReason, /push forçado/)
})

test('CLI não imprime nada para comando comum', () => {
  const r = rodar({ tool_name: 'Bash', tool_input: { command: 'git status' } })
  assert.equal(r.status, 0)
  assert.equal(r.stdout, '')
})

test('CLI não quebra com stdin inválido', () => {
  for (const entrada of ['not json', '', '{}', '{"tool_input":{"command":42}}']) {
    const r = rodar(entrada)
    assert.equal(r.status, 0)
    assert.equal(r.stdout, '')
  }
})

test('avaliar pede confirmação para rm -rf / dentro de $(...), crase, bash -c, eval e heredoc', () => {
  const casos = [
    'echo "$(rm -rf /)"',
    'x="$(echo "$(rm -rf /)")"',
    'echo "`rm -rf /`"',
    "bash -c 'rm -rf /'",
    'sh -c "rm -rf /"',
    'zsh -c "git reset --hard"',
    'eval "rm -rf /"',
    'eval rm -rf /',
    'bash <<EOF\nrm -rf /\nEOF',
    "sh <<'EOF'\nrm -rf /\nEOF",
    'bash <<-EOF\n\trm -rf /\n\tEOF',
  ]
  for (const comando of casos) {
    assert.equal(avaliar(comando).decisao, 'ask', comando)
  }
})

test('avaliar continua liberando echo "$(date)"', () => {
  for (const comando of ['echo "$(date)"', 'echo `date`', 'cat <<EOF > notas.txt\nfrete e seguro\nEOF', "cat <<'EOF' > a.sh\nrm -rf /\nEOF", 'grep -r "DROP TABLE" .']) {
    assert.deepEqual(avaliar(comando), { decisao: 'allow' }, comando)
  }
})
