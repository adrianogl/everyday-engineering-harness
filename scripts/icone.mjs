#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import { desenharIcone } from './lib/icone.mjs'

writeFileSync('.claude-plugin/icon.png', desenharIcone(512))
writeFileSync('site/favicon.png', desenharIcone(64))
