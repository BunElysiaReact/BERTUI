// bertui/src/build/image-optimizer.js - UPDATED WITH WASM
import { join, extname } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import logger from '../logger/logger.js';
import { optimizeImage, hasWasm } from '../image-optimizer/index.js';
import { copyImagesSync } from '../images/index.js';

export async function optimizeImages(srcDir, outDir, options = {}) {
  const {
    quality = 80,
    webpQuality = 75,
    verbose = false
  } = options;

  // Check if WASM is available
  const wasmAvailable = await hasWasm();
  
  if (wasmAvailable) {
    logger.info(`🦀 Optimizing images with Rust WASM (quality: ${quality})...`);
  } else {
    logger.info('📋 Copying images (WASM optimizer not available)...');
  }

  const imageExtensions = [
    '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', 
    '.avif', '.ico', '.bmp', '.tiff', '.tif'
  ];
  
  let optimized = 0;
  let copied = 0;
  let skipped = 0;
  let totalSaved = 0;
  const results = [];

  if (!existsSync(srcDir)) {
    logger.warn(`⚠️  Source not found: ${srcDir}`);
    return { optimized: 0, copied: 0, saved: 0, results: [] };
  }

  mkdirSync(outDir, { recursive: true });

  async function processDirectory(dir, targetDir) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(dir, entry.name);
      const destPath = join(targetDir, entry.name);

      if (entry.isDirectory()) {
        const subDestPath = join(targetDir, entry.name);
        mkdirSync(subDestPath, { recursive: true });
        await processDirectory(srcPath, subDestPath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        
        if (imageExtensions.includes(ext)) {
          try {
            const file = Bun.file(srcPath);
            const buffer = await file.arrayBuffer();
            const originalSize = buffer.byteLength;
            
            // Try WASM optimization first, fallback to copy
            if (wasmAvailable && ['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
              const format = ext.slice(1);
              const result = await optimizeImage(buffer, {
                format,
                quality,
                webpQuality
              });
              
              await Bun.write(destPath, new Uint8Array(result.data));
              
              const saved = originalSize - result.optimized_size;
              totalSaved += saved;
              optimized++;
              
              results.push({
                file: entry.name,
                original: formatBytes(originalSize),
                optimized: formatBytes(result.optimized_size),
                saved: formatBytes(saved),
                percent: result.savings_percent.toFixed(1) + '%'
              });
            } else {
              // Just copy unsupported formats
              await Bun.write(destPath, file);
              copied++;
              results.push({
                file: entry.name,
                status: 'copied'
              });
            }
          } catch (error) {
            logger.warn(`  Failed to process ${entry.name}: ${error.message}`);
            // Fallback: copy original
            await Bun.write(destPath, Bun.file(srcPath));
            copied++;
          }
        } else {
          // Copy non-image files
          await Bun.write(destPath, Bun.file(srcPath));
          skipped++;
        }
      }
    }
  }

  await processDirectory(srcDir, outDir);

  // Show summary
  if (optimized > 0) {
    logger.success(`✅ Optimized ${optimized} images with Rust WASM`);
    logger.table(results.slice(0, 10));
    if (results.length > 10) {
      logger.info(`   ... and ${results.length - 10} more images`);
    }
    logger.info(`📊 Total saved: ${formatBytes(totalSaved)}`);
  }
  
  if (copied > 0) {
    logger.info(`📋 Copied ${copied} images (fallback)`);
  }

  return { optimized, copied, saved: totalSaved, results };
}

export function copyImages(srcDir, outDir) {
  return copyImagesSync(srcDir, outDir);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}