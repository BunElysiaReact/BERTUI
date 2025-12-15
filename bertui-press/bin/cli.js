#!/usr/bin/env bun
import { BertUIPress } from '../src/index.js';

const command = Bun.argv[2];

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

if (command === 'build') {
  const press = new BertUIPress();
  await press.build();
} else if (command === 'dev') {
  const press = new BertUIPress();
  press.dev();
} else {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════╗
║       BertUI-Press CLI                ║
╚═══════════════════════════════════════╝
${colors.reset}
Commands:
  ${colors.green}bertui-press build${colors.reset}   Build docs once
  ${colors.green}bertui-press dev${colors.reset}     Watch & rebuild

Examples:
  ${colors.yellow}bertui-press build${colors.reset}
  ${colors.yellow}bertui-press dev${colors.reset}
`);
}

