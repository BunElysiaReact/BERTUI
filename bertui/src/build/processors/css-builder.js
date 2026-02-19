// bertui/src/build/processors/css-builder.js - WITH SCSS + CACHING
import { join } from 'path';
import { existsSync, readdirSync, mkdirSync } from 'fs';
import logger from '../../logger/logger.js';
import { globalCache } from '../../utils/cache.js';
import { minifyCSS, processSCSS } from '../../css/processor.js';

export async function buildAllCSS(root, outDir) {
  const startTime = process.hrtime.bigint();
  
  const srcStylesDir = join(root, 'src', 'styles');
  const stylesOutDir = join(outDir, 'styles');
  
  mkdirSync(stylesOutDir, { recursive: true });
  
  // Check cache for entire CSS build
  const cacheKey = `css-build:${root}:${Date.now()}`;
  const cached = globalCache.get(cacheKey, { ttl: 1000 }); // 1 second cache
  
  if (cached) {
    logger.info(`⚡ Using cached CSS (${cached.files} files)`);
    await Bun.write(join(stylesOutDir, 'bertui.min.css'), cached.content);
    return;
  }
  
  if (!existsSync(srcStylesDir)) {
    await Bun.write(join(stylesOutDir, 'bertui.min.css'), '/* No custom styles */');
    logger.info('No styles directory found, created empty CSS');
    return;
  }
  
  // Process SCSS files first
  await processSCSSDirectory(srcStylesDir, root);
  
  // Read all CSS files (including compiled SCSS)
  const cssFiles = readdirSync(srcStylesDir).filter(f => f.endsWith('.css'));
  
  if (cssFiles.length === 0) {
    await Bun.write(join(stylesOutDir, 'bertui.min.css'), '/* No CSS */');
    return;
  }
  
  logger.info(`Processing ${cssFiles.length} CSS file(s)...`);
  
  let combinedCSS = '';
  const fileContents = [];
  
  for (const cssFile of cssFiles) {
    const srcPath = join(srcStylesDir, cssFile);
    
    // Use file cache
    const fileBuffer = await globalCache.getFile(srcPath, { logSpeed: true });
    if (fileBuffer) {
      const content = fileBuffer.toString('utf-8');
      fileContents.push({ filename: cssFile, content });
      combinedCSS += `/* ${cssFile} */\n${content}\n\n`;
    }
  }
  
  const combinedPath = join(stylesOutDir, 'bertui.min.css');
  
  // Minify with caching
  const minifyCacheKey = `minify:${Buffer.from(combinedCSS).length}:${combinedCSS.substring(0, 100)}`;
  let minified = globalCache.get(minifyCacheKey);
  
  if (!minified) {
    minified = await minifyCSS(combinedCSS, {
      filename: 'bertui.min.css',
      sourceMap: false
    });
    globalCache.set(minifyCacheKey, minified, { ttl: 60000 }); // Cache for 60 seconds
  }
  
  await Bun.write(combinedPath, minified);
  
  const originalSize = Buffer.byteLength(combinedCSS);
  const minifiedSize = Buffer.byteLength(minified);
  const reduction = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
  
  const endTime = process.hrtime.bigint();
  const duration = Number(endTime - startTime) / 1000; // Microseconds
  
  logger.success(`CSS optimized: ${(originalSize/1024).toFixed(2)}KB → ${(minifiedSize/1024).toFixed(2)}KB (-${reduction}%)`);
  logger.info(`⚡ Processing time: ${duration.toFixed(3)}µs`);
  
  // Cache the final result
  globalCache.set(cacheKey, {
    files: cssFiles.length,
    content: minified,
    size: minifiedSize
  }, { ttl: 5000 });
}

// NEW: Process SCSS directory
async function processSCSSDirectory(stylesDir, root) {
  try {
    // Check if sass is installed
    const sass = await import('sass').catch(() => null);
    if (!sass) return;
    
    const files = readdirSync(stylesDir);
    const scssFiles = files.filter(f => f.endsWith('.scss') || f.endsWith('.sass'));
    
    if (scssFiles.length === 0) return;
    
    logger.info(`📝 Compiling ${scssFiles.length} SCSS files...`);
    
    for (const file of scssFiles) {
      const srcPath = join(stylesDir, file);
      const cssPath = join(stylesDir, file.replace(/\.(scss|sass)$/, '.css'));
      
      // Check cache
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