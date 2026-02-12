// 3. src/image-optimizer/index.js - USE OXIPNG BINARY
import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { tmpdir } from 'os';
import { writeFile, readFile, unlink } from 'fs/promises';

const execAsync = promisify(exec);

export async function optimizeImage(buffer, options = {}) {
  const { format = 'auto', quality = 3 } = options;
  
  // Detect format
  const detectedFormat = format === 'auto' ? detectFormat(buffer) : format;
  
  // Only PNG supported for now
  if (detectedFormat === 'png') {
    return await optimizePNG(buffer, quality);
  }
  
  // Fallback to copy
  return fallbackOptimize(buffer, detectedFormat);
}

async function optimizePNG(buffer, level = 3) {
  const original_size = buffer.byteLength;
  
  // Write temp file
  const tmpPath = join(tmpdir(), `bertui-${Date.now()}.png`);
  const outPath = join(tmpdir(), `bertui-${Date.now()}-opt.png`);
  
  try {
    await writeFile(tmpPath, Buffer.from(buffer));
    
    // Run oxipng binary
    await execAsync(`oxipng -o ${level} -s "${tmpPath}" -o "${outPath}"`);
    
    // Read optimized file
    const optimized = await readFile(outPath);
    const optimized_size = optimized.length;
    const savings_percent = ((original_size - optimized_size) / original_size * 100).toFixed(1);
    
    return {
      data: optimized.buffer,
      original_size,
      optimized_size,
      format: 'png',
      savings_percent: parseFloat(savings_percent)
    };
  } finally {
    // Cleanup
    await unlink(tmpPath).catch(() => {});
    await unlink(outPath).catch(() => {});
  }
}

function fallbackOptimize(buffer, format) {
  return {
    data: buffer,
    original_size: buffer.byteLength,
    optimized_size: buffer.byteLength,
    format,
    savings_percent: 0
  };
}

function detectFormat(buffer) {
  if (buffer.length >= 8) {
    const pngSig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    if (pngSig.every((b, i) => buffer[i] === b)) return 'png';
  }
  return 'unknown';
}

export const hasWasm = () => false;
export const version = '1.1.7';