#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const required = [
  'specs/001-p2p-payment-request/spec.md',
  'specs/001-p2p-payment-request/data-model.md',
  'specs/001-p2p-payment-request/contracts/openapi.yaml',
  'specs/001-p2p-payment-request/plan.md',
  'SPEC.md',
]

const missing = required.filter((p) => !fs.existsSync(path.join(process.cwd(), p)))

if (missing.length > 0) {
  console.error('Spec verification failed. Missing files:')
  missing.forEach((m) => console.error(' -', m))
  process.exitCode = 2
  process.exit(2)
}

console.log('Spec verification passed')
