// bertui/src/logger/logger.js
// Compact, progress-style CLI — replaces verbose line-by-line logs

import { createWriteStream } from 'fs';
import { join } from 'path';

// ── ANSI helpers ─────────────────────────────────────────────────────────────
const C = {
  reset:    '\x1b[0m',
  bold:     '\x1b[1m',
  dim:      '\x1b[2m',
  red:      '\x1b[31m',
  green:    '\x1b[32m',
  yellow:   '\x1b[33m',
  blue:     '\x1b[34m',
  magenta:  '\x1b[35m',
  cyan:     '\x1b[36m',
  white:    '\x1b[37m',
  bgBlack:  '\x1b[40m',
  bgRed:    '\x1b[41m',
  bgGreen:  '\x1b[42m',
  bgBlue:   '\x1b[44m',
  bgCyan:   '\x1b[46m',
  bgWhite:  '\x1b[47m',
  gray:     '\x1b[90m',
};

const isTTY = process.stdout.isTTY;

// ── Spinner frames ────────────────────────────────────────────────────────────
const SPINNER = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
let _spinnerFrame = 0;
let _spinnerTimer = null;
let _currentSpinnerLine = '';

// ── Internal state ────────────────────────────────────────────────────────────
let _mode       = 'idle';   // 'idle' | 'build' | 'dev'
let _totalSteps = 10;
let _stepIndex  = 0;
let _stepLabel  = '';
let _stepDetail = '';
let _errors     = [];
let _warnings   = [];
let _startTime  = null;

// ── Header ────────────────────────────────────────────────────────────────────
export function printHeader(mode = 'BUILD') {
  _mode      = mode.toLowerCase();
  _startTime = Date.now();
  _errors    = [];
  _warnings  = [];

  const W = 46;
  const bar = '█'.repeat(W);

  // Big block-letter BERTUI (6 rows)
  const BIG = [
    '  ██████╗ ███████╗██████╗ ████████╗██╗   ██╗██╗',
    '  ██╔══██╗██╔════╝██╔══██╗╚══██╔══╝██║   ██║██║',
    '  ██████╔╝█████╗  ██████╔╝   ██║   ██║   ██║██║',
    '  ██╔══██╗██╔══╝  ██╔══██╗   ██║   ██║   ██║██║',
    '  ██████╔╝███████╗██║  ██║   ██║   ╚██████╔╝██║',
    '  ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝',
  ];

  process.stdout.write('\n');
  process.stdout.write(`${C.cyan}${C.bold}  ${bar}${C.reset}\n`);
  for (const row of BIG) {
    process.stdout.write(`${C.cyan}${C.bold}${row}${C.reset}\n`);
  }
  process.stdout.write(`${C.gray}  by Pease Ernest${C.reset}${C.gray}  ·  ${C.reset}${C.white}${C.bold}${mode.toUpperCase()}${C.reset}\n`);
  process.stdout.write(`${C.cyan}${C.bold}  ${bar}${C.reset}\n`);
  process.stdout.write('\n');
}

// ── Step progress ─────────────────────────────────────────────────────────────
export function step(index, total, label, detail = '') {
  _stepIndex  = index;
  _totalSteps = total;
  _stepLabel  = label;
  _stepDetail = detail;
  _stopSpinner();
  _renderStep('running', detail);
  _startSpinner();
}

export function stepDone(label, detail = '') {
  _stopSpinner();
  _clearLine();
  const idx = String(_stepIndex).padStart(2, ' ');
  const lbl = (label || _stepLabel).padEnd(24, ' ');
  const det = detail ? `${C.gray}${_truncate(detail, 38)}${C.reset}` : '';
  process.stdout.write(
    `  ${C.gray}[${idx}/${_totalSteps}]${C.reset} ${C.green}✓${C.reset}  ${C.white}${lbl}${C.reset} ${det}\n`
  );
}

export function stepFail(label, detail = '') {
  _stopSpinner();
  _clearLine();
  const idx = String(_stepIndex).padStart(2, ' ');
  const lbl = (label || _stepLabel).padEnd(24, ' ');
  process.stdout.write(
    `  ${C.gray}[${idx}/${_totalSteps}]${C.reset} ${C.red}✗${C.reset}  ${C.white}${lbl}${C.reset} ${C.red}${detail}${C.reset}\n`
  );
}

// ── Inline file progress (replaces "Progress: 2/2 (100%)") ───────────────────
export function fileProgress(current, total, filename) {
  if (!isTTY) return;
  _clearLine();
  const pct  = Math.round((current / total) * 100);
  const bar  = _bar(pct, 16);
  const name = _truncate(filename, 30);
  _currentSpinnerLine =
    `  ${C.gray}[${String(_stepIndex).padStart(2,' ')}/${_totalSteps}]${C.reset}` +
    ` ${C.cyan}⠸${C.reset}  ${C.white}${_stepLabel.padEnd(24,' ')}${C.reset}` +
    ` ${bar} ${C.gray}${current}/${total}${C.reset} ${C.dim}${name}${C.reset}`;
  process.stdout.write('\r' + _currentSpinnerLine);
}

// ── Simple log levels (used internally, suppressed in compact mode) ───────────
export function info(msg) {
  // In compact mode swallow routine info — only pass through to debug log
  _debugLog('INFO', msg);
}

export function success(msg) {
  // Swallow — stepDone() is the visual replacement
  _debugLog('SUCCESS', msg);
}

export function warn(msg) {
  _warnings.push(msg);
  _stopSpinner();
  _clearLine();
  process.stdout.write(`  ${C.yellow}⚠${C.reset}  ${C.yellow}${msg}${C.reset}\n`);
  if (_stepLabel) _startSpinner();
}

export function error(msg) {
  _errors.push(msg);
  _stopSpinner();
  _clearLine();
  process.stdout.write(`  ${C.red}✗${C.reset}  ${C.red}${msg}${C.reset}\n`);
}

export function debug(msg) {
  _debugLog('DEBUG', msg);
}

// ── Table (kept for route/island tables but made compact) ─────────────────────
export function table(rows) {
  if (!rows || rows.length === 0) return;
  _stopSpinner();
  const keys = Object.keys(rows[0]).filter(k => k !== '');
  const widths = keys.map(k =>
    Math.max(k.length, ...rows.map(r => String(r[k] ?? '').length))
  );

  const hr = '  ' + widths.map(w => '─'.repeat(w + 2)).join('┼') ;
  const header = '  ' + keys.map((k, i) => ` ${C.bold}${k.padEnd(widths[i])}${C.reset} `).join('│');

  process.stdout.write(`${C.gray}${hr}${C.reset}\n`);
  process.stdout.write(`${header}\n`);
  process.stdout.write(`${C.gray}${hr}${C.reset}\n`);

  for (const row of rows) {
    const line = '  ' + keys.map((k, i) => ` ${String(row[k] ?? '').padEnd(widths[i])} `).join(`${C.gray}│${C.reset}`);
    process.stdout.write(`${line}\n`);
  }
  process.stdout.write(`${C.gray}${hr}${C.reset}\n`);

  if (_stepLabel) _startSpinner();
}

// ── bigLog — replaced by section headers ─────────────────────────────────────
export function bigLog(title, opts = {}) {
  _stopSpinner();
  _clearLine();
  process.stdout.write(`\n  ${C.bold}${C.cyan}── ${title} ──${C.reset}\n\n`);
  if (_stepLabel) _startSpinner();
}

// ── Build/Dev summary ─────────────────────────────────────────────────────────
export function printSummary(stats = {}) {
  _stopSpinner();
  process.stdout.write('\n');

  const dur = _startTime ? `${((Date.now() - _startTime) / 1000).toFixed(2)}s` : '';

  process.stdout.write(`${C.cyan}${C.bold}  ────────────────────────────────────────────${C.reset}\n`);
  process.stdout.write(`${C.green}${C.bold}  ✓ Done${C.reset}${dur ? `  ${C.gray}${dur}${C.reset}` : ''}\n`);

  if (stats.routes)       _summaryLine('Routes',          stats.routes);
  if (stats.serverIslands)_summaryLine('Server Islands',  stats.serverIslands);
  if (stats.interactive)  _summaryLine('Interactive',     stats.interactive);
  if (stats.staticRoutes) _summaryLine('Static',          stats.staticRoutes);
  if (stats.jsSize)       _summaryLine('JS bundle',       stats.jsSize);
  if (stats.cssSize)      _summaryLine('CSS bundle',      stats.cssSize);
  if (stats.outDir)       _summaryLine('Output',          stats.outDir);

  if (_warnings.length > 0) {
    process.stdout.write(`\n  ${C.yellow}${_warnings.length} warning(s)${C.reset}\n`);
  }
  if (_errors.length > 0) {
    process.stdout.write(`\n  ${C.red}${_errors.length} error(s)${C.reset}\n`);
    _errors.forEach(e => process.stdout.write(`  ${C.red}  · ${e}${C.reset}\n`));
  }

  process.stdout.write(`${C.cyan}${C.bold}  ────────────────────────────────────────────${C.reset}\n\n`);
}

function _summaryLine(label, value) {
  process.stdout.write(
    `  ${C.gray}${label.padEnd(18)}${C.reset}${C.white}${value}${C.reset}\n`
  );
}

// ── Spinner internals ─────────────────────────────────────────────────────────
function _startSpinner() {
  if (!isTTY || _spinnerTimer) return;
  _spinnerTimer = setInterval(() => {
    _spinnerFrame = (_spinnerFrame + 1) % SPINNER.length;
    _renderStep('running', _stepDetail);
  }, 80);
}

function _stopSpinner() {
  if (_spinnerTimer) {
    clearInterval(_spinnerTimer);
    _spinnerTimer = null;
  }
}

function _renderStep(state, detail = '') {
  if (!isTTY) return;
  _clearLine();
  const spin = SPINNER[_spinnerFrame];
  const idx  = String(_stepIndex).padStart(2, ' ');
  const lbl  = _stepLabel.padEnd(24, ' ');
  const det  = detail ? `${C.gray}${_truncate(detail, 38)}${C.reset}` : '';
  _currentSpinnerLine =
    `  ${C.gray}[${idx}/${_totalSteps}]${C.reset} ${C.cyan}${spin}${C.reset}  ${C.white}${lbl}${C.reset} ${det}`;
  process.stdout.write('\r' + _currentSpinnerLine);
}

function _clearLine() {
  if (!isTTY) return;
  process.stdout.write('\r\x1b[2K');
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function _bar(pct, width) {
  const filled = Math.round((pct / 100) * width);
  const empty  = width - filled;
  return `${C.cyan}${'█'.repeat(filled)}${C.gray}${'░'.repeat(empty)}${C.reset}`;
}

function _truncate(str, max) {
  if (!str) return '';
  str = String(str);
  return str.length > max ? '…' + str.slice(-(max - 1)) : str;
}

// ── Debug file log (always written, never shown in terminal) ──────────────────
let _logStream = null;
function _debugLog(level, msg) {
  if (!_logStream) {
    try {
      _logStream = createWriteStream(
        join(process.cwd(), '.bertui', 'dev.log'),
        { flags: 'a' }
      );
    } catch { return; }
  }
  const ts = new Date().toISOString().substring(11, 23);
  _logStream.write(`[${ts}] [${level}] ${msg}\n`);
}

// ── Default export (matches existing logger.method() call sites) ──────────────
export default {
  printHeader,
  step,
  stepDone,
  stepFail,
  fileProgress,
  info,
  success,
  warn,
  error,
  debug,
  table,
  bigLog,
  printSummary,
};