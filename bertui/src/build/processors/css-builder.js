// bertui/src/build/processors/css-builder.js - WITH SCSS + CACHING + CSS MODULES
import { join } from 'path';
import { existsSync, readdirSync, mkdirSync } from 'fs';
import logger from '../../logger/logger.js';
import { globalCache } from '../../utils/cache.js';
import { minifyCSS, processSCSS } from '../../css/processor.js';

export async function buildAllCSS(root, outDir) {
  const startTime = process.hrtime.bigint();
  
  const srcStylesDir = join(root, 'src', 'styles');
  // CSS modules scoped CSS is staged here by file-transpiler.js
  const modulesStagingDir = join(root, '.bertuibuild', 'styles-staged');
  const stylesOutDir = join(outDir, 'styles');
  
  mkdirSync(stylesOutDir, { recursive: true });
  
  const cacheKey = `css-build:${root}:${Date.now()}`;
  const cached = globalCache.get(cacheKey, { ttl: 1000 });
  
  if (cached) {
    logger.info(`⚡ Using cached CSS (${cached.files} files)`);
    await Bun.write(join(stylesOutDir, 'bertui.min.css'), cached.content);
    return;
  }
  
  let combinedCSS = '';
  let fileCount = 0;

  // 1. Process src/styles/ (plain CSS + SCSS)
  if (existsSync(srcStylesDir)) {
    await processSCSSDirectory(srcStylesDir, root);
    const cssFiles = readdirSync(srcStylesDir).filter(f => f.endsWith('.css') && !f.endsWith('.module.css'));

    logger.info(`Processing ${cssFiles.length} CSS file(s)...`);

    for (const cssFile of cssFiles) {
      const srcPath = join(srcStylesDir, cssFile);
      const fileBuffer = await globalCache.getFile(srcPath, { logSpeed: true });
      if (fileBuffer) {
        const content = fileBuffer.toString('utf-8');
        combinedCSS += `/* ${cssFile} */\n${content}\n\n`;
        fileCount++;
      }
    }
  } else {
    logger.info('No styles directory found');
  }

  // 2. Include scoped CSS from CSS modules (staged by file-transpiler.js)
  if (existsSync(modulesStagingDir)) {
    const moduleFiles = readdirSync(modulesStagingDir).filter(f => f.endsWith('.css'));
    if (moduleFiles.length > 0) {
      logger.info(`Including ${moduleFiles.length} CSS module(s)...`);
      for (const cssFile of moduleFiles) {
        const srcPath = join(modulesStagingDir, cssFile);
        const content = await Bun.file(srcPath).text();
        combinedCSS += `/* module: ${cssFile} */\n${content}\n\n`;
        fileCount++;
      }
    }
  }

  if (!combinedCSS.trim()) {
    await Bun.write(join(stylesOutDir, 'bertui.min.css'), '/* No CSS */');
    return;
  }

  const combinedPath = join(stylesOutDir, 'bertui.min.css');
  
  const minifyCacheKey = `minify:${Buffer.from(combinedCSS).length}:${combinedCSS.substring(0, 100)}`;
  let minified = globalCache.get(minifyCacheKey);
  
  if (!minified) {
    minified = await minifyCSS(combinedCSS, {
      filename: 'bertui.min.css',
      sourceMap: false
    });
    globalCache.set(minifyCacheKey, minified, { ttl: 60000 });
  }
  
  await Bun.write(combinedPath, minified);
  
  const originalSize = Buffer.byteLength(combinedCSS);
  const minifiedSize = Buffer.byteLength(minified);
  const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
  
  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1000;
  
  logger.success(`CSS optimized: ${(originalSize/1024).toFixed(2)}KB → ${(minifiedSize/1024).toFixed(2)}KB (-${reduction}%)`);
  logger.info(`⚡ Processing time: ${duration.toFixed(3)}µs`);
  
  globalCache.set(cacheKey, {
    files: fileCount,
    content: minified,
    size: minifiedSize
  }, { ttl: 5000 });
}

async function processSCSSDirectory(stylesDir, root) {
  try {
    const sass = await import('sass').catch(() => null);
    if (!sass) return;
    
    const files = readdirSync(stylesDir);
    const scssFiles = files.filter(f => f.endsWith('.scss') || f.endsWith('.sass'));
    
    if (scssFiles.length === 0) return;
    
    logger.info(`📝 Compiling ${scssFiles.length} SCSS files...`);
    
    for (const file of scssFiles) {
      const srcPath = join(stylesDir, file);
      const cssPath = join(stylesDir, file.replace(/\.(scss|sass)$/, '.css'));
      
      const fileBuffer = await globalCache.getFile(srcPath);
      const cacheKey = `scss:${file}:${Buffer.from(fileBuffer).length}`;
      const cached = globalCache.get(cacheKey);
      
      if (cached && existsSync(cssPath)) {
        logger.debug(`⚡ Cached SCSS: ${file} → ${file.replace(/\.(scss|sass)$/, '.css')}`);
        continue;
      }
      
      const result = sass.compile(srcPath, {
        style: 'expanded',
        sourceMap: false,
        loadPaths: [stylesDir, join(root, 'node_modules')]
      });
      
      await Bun.write(cssPath, result.css);
      globalCache.set(cacheKey, true, { ttl: 30000 });
      
      logger.debug(`   ${file} → ${file.replace(/\.(scss|sass)$/, '.css')}`);
    }
    
    logger.success(`✅ SCSS compilation complete`);
  } catch (error) {
    logger.warn(`SCSS processing skipped: ${error.message}`);
  }
}