// bertui/src/images/processor.js - PURE IMAGE PROCESSING
import { join, extname } from 'path';
import { cpSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import logger from '../logger/logger.js';

// All supported image formats
export const IMAGE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', 
  '.avif', '.ico', '.bmp', '.tiff', '.tif'
];

/**
 * Check if a file is an image based on extension
 */
export function isImageFile(filename) {
  if (!filename) return false;
  const ext = extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Get image content type for HTTP headers
 */
export function getImageContentType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.ico': 'image/x-icon',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff'
  };
  
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * Copy images synchronously from source to destination
 */
export function copyImagesSync(srcDir, destDir, options = {}) {
  const {
    verbose = false,
    overwrite = true,
    filter = null
  } = options;

  let copied = 0;
  let skipped = 0;
  let failed = 0;

  if (!existsSync(srcDir)) {
    logger.warn(`Source directory not found: ${srcDir}`);
    return { copied, skipped, failed };
  }

  // Create destination directory
  mkdirSync(destDir, { recursive: true });

  function copyDir(dir, targetDir) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const srcPath = join(dir, entry.name);
        const destPath = join(targetDir, entry.name);

        // Skip if filtered
        if (filter && !filter(srcPath)) {
          skipped++;
          continue;
        }

        if (entry.isDirectory()) {
          // Recursively copy subdirectories
          const subDest = join(targetDir, entry.name);
          mkdirSync(subDest, { recursive: true });
          copyDir(srcPath, subDest);
        } 
        else if (entry.isFile() && isImageFile(entry.name)) {
          try {
            // Check if destination exists and we should overwrite
            if (!overwrite && existsSync(destPath)) {
              skipped++;
              if (verbose) logger.debug(`Skipped existing: ${entry.name}`);
              continue;
            }

            cpSync(srcPath, destPath);
            copied++;
            
            if (verbose) {
              const srcSize = statSync(srcPath).size;
              logger.debug(`Copied: ${entry.name} (${(srcSize / 1024).toFixed(2)}KB)`);
            }
          } catch (error) {
            failed++;
            logger.warn(`Failed to copy ${entry.name}: ${error.message}`);
          }
        } else {
          skipped++;
        }
      }
    } catch (error) {
      logger.error(`Error processing ${dir}: ${error.message}`);
    }
  }

  copyDir(srcDir, destDir);

  return { copied, skipped, failed };
}

/**
 * Get all image files from a directory recursively
 */
export function getImageFiles(dir, baseDir = dir) {
  const images = [];

  if (!existsSync(dir)) {
    return images;
  }

  function scan(directory) {
    const entries = readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(directory, entry.name);
      const relativePath = fullPath.replace(baseDir, '').replace(/^[\/\\]/, '');

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && isImageFile(entry.name)) {
        images.push({
          path: fullPath,
          relativePath,
          filename: entry.name,
          size: statSync(fullPath).size,
          ext: extname(entry.name).toLowerCase()
        });
      }
    }
  }

  scan(dir);
  return images;
}

/**
 * Calculate total size of images
 */
export function getTotalImageSize(images) {
  return images.reduce((total, img) => total + img.size, 0);
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}