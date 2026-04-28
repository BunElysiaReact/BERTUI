// bertui/src/build/image-optimizer.js
import { join, extname } from 'path';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import logger from '../logger/logger.js';

const OPTIMIZABLE = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];
const COPYABLE = ['.gif', '.svg', '.ico', '.bmp', '.tiff', '.tif'];

export async function optimizeImages(srcDir, outDir, options = {}) {
  const { quality = 80, webpQuality = 75 } = options;

  let sharp;
  try {
    sharp = (await import('sharp')).default;
    logger.info(`🖼️  Optimizing images with sharp (quality: ${quality})...`);
  } catch {
    logger.warn('sharp not installed — copying images as-is');
    return copyAllImages(srcDir, outDir);
  }

  if (!existsSync(srcDir)) {
    logger.warn(`⚠️  Source not found: ${srcDir}`);
    return { optimized: 0, copied: 0, saved: 0 };
  }

  mkdirSync(outDir, { recursive: true });

  let optimized = 0, copied = 0, totalSaved = 0;

  async function processDirectory(dir, targetDir) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(dir, entry.name);
      const destPath = join(targetDir, entry.name);

      if (entry.isDirectory()) {
        mkdirSync(destPath, { recursive: true });
        await processDirectory(srcPath, destPath);
        continue;
      }

      const ext = extname(entry.name).toLowerCase();

      if (OPTIMIZABLE.includes(ext)) {
        try {
          const originalSize = (await Bun.file(srcPath).arrayBuffer()).byteLength;

          await sharp(srcPath)
            .webp({ quality: webpQuality })
            .toFile(destPath.replace(ext, '.webp'));

          const newSize = (await Bun.file(destPath.replace(ext, '.webp')).arrayBuffer()).byteLength;
          totalSaved += originalSize - newSize;
          optimized++;
        } catch (e) {
          logger.warn(`  Failed to optimize ${entry.name}: ${e.message}, copying instead`);
          await Bun.write(destPath, Bun.file(srcPath));
          copied++;
        }
      } else if (COPYABLE.includes(ext)) {
        await Bun.write(destPath, Bun.file(srcPath));
        copied++;
      }
    }
  }

  await processDirectory(srcDir, outDir);

  logger.success(`✅ Images: ${optimized} optimized, ${copied} copied, saved ${formatBytes(totalSaved)}`);
  return { optimized, copied, saved: totalSaved };
}

async function copyAllImages(srcDir, outDir) {
  if (!existsSync(srcDir)) return { optimized: 0, copied: 0, saved: 0 };
  mkdirSync(outDir, { recursive: true });

  let copied = 0;
  const all = [...OPTIMIZABLE, ...COPYABLE];

  async function walk(dir, targetDir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const src = join(dir, entry.name);
      const dest = join(targetDir, entry.name);
      if (entry.isDirectory()) {
        mkdirSync(dest, { recursive: true });
        await walk(src, dest);
      } else if (all.includes(extname(entry.name).toLowerCase())) {
        await Bun.write(dest, Bun.file(src));
        copied++;
      }
    }
  }

  await walk(srcDir, outDir);
  logger.info(`📋 Copied ${copied} images`);
  return { optimized: 0, copied, saved: 0 };
}

export function copyImages(srcDir, outDir) {
  return copyAllImages(srcDir, outDir);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}