// scripts/fix-wasm-exports.js
// Run after wasm-pack to ensure Bun compatibility

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const wasmDir = join(process.cwd(), 'dist/image-optimizer/wasm');
const jsFile = join(wasmDir, 'bertui_image_optimizer.js');

try {
  let code = readFileSync(jsFile, 'utf8');
  
  // Fix for Bun/ESM
  code = code.replace(
    /import \* as wasm from "\.\/bertui_image_optimizer_bg\.wasm\?module";/,
    'import wasm from "./bertui_image_optimizer_bg.wasm";'
  );
  
  code = code.replace(
    /await wasm\(/,
    'await (wasm instanceof WebAssembly.Module ? WebAssembly.instantiate(wasm) : wasm())'
  );
  
  writeFileSync(jsFile, code);
  console.log('✅ Fixed WASM exports for Bun compatibility');
} catch (err) {
  console.error('Failed to fix WASM exports:', err.message);
}