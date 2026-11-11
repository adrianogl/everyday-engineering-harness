#!/usr/bin/env bash
set -e
mkdir -p .eeh/PROJ-7-frete
printf '## 2026-11-10\n\nusar cache de 5 minutos\n' > .eeh/PROJ-7-frete/decisoes.md
mkdir -p ../.config/eeh
printf '{"registros":"%s/.eeh"}\n' "$PWD" > ../.config/eeh/perfil.json
