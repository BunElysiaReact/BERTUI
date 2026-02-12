// bertui/src/images/index.js
// PURE image handling - NO WASM, NO SHARP, just copy (FALLBACK)

import { join, extname } from 'path';
import { cpSync, mkdirSync, existsSync, readdirSync } from 'fs';
import logger from '../logger/logger.js';

export const IMAGE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', 
  '.avif', '.ico', '.bmp', '.tiff', '.tif'
];

export function isImageFile(filename) {
  const ext = extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

export function copyImagesSync(srcDir, destDir) {
  let copied = 0;
  let skipped = 0;

  if (!existsSync(srcDir)) return { copied, skipped };

  mkdirSync(destDir, { recursive: true });

  function process(dir, targetDir) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(dir, entry.name);
      const destPath = join(targetDir, entry.name);

      if (entry.isDirectory()) {
        const subDest = join(targetDir, entry.name);
        mkdirSync(subDest, { recursive: true });
        process(srcPath, subDest);
      } else if (entry.isFile() && isImageFile(entry.name)) {
        try {
          cpSync(srcPath, destPath);
          copied++;
        } catch (error) {
          logger.warn(`Failed to copy ${entry.name}: ${error.message}`);
          skipped++;
        }
      } else {
        skipped++;
      }
    }
  }

  process(srcDir, destDir);
  return { copied, skipped };
}

export function getImageContentType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon'
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

export function getImageFiles(dir, baseDir = dir) {
  const images = [];
  if (!existsSync(dir)) return images;

  function scan(directory) {
    const entries = readdirSync(directory, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(directory, entry.name);
      const relativePath = fullPath.replace(baseDir, '').replace(/^[\/\\]/, '');
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && isImageFile(entry.name)) {
        images.push({ path: fullPath, relativePath, filename: entry.name });
      }
    }
  }
  scan(dir);
  return images;
}

export function getTotalImageSize(images) {
  return images.reduce((total, img) => total + img.size, 0);
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Legacy exports
export { optimizeImages, copyImages } from '../build/image-optimizer.js';