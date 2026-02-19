// bertui/src/build.js - COMPLETE FIXED VERSION WITH PROPER EXIT
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import logger from './logger/logger.js';
import { loadEnvVariables } from './utils/env.js';
import { globalCache } from './utils/cache.js';

import { compileForBuild } from './build/compiler/index.js';
import { buildAllCSS } from './build/processors/css-builder.js';
import { copyAllStaticAssets } from './build/processors/asset-processor.js';
import { generateProductionHTML } from './build/generators/html-generator.js';
import { generateSitemap } from './build/generators/sitemap-generator.js';
import { generateRobots } from './build/generators/robots-generator.js';

export async function buildProduction(options = {}) {
  const root = options.root || process.cwd();
  const buildDir = join(root, '.bertuibuild');
  const outDir = join(root, 'dist');
  
  // Force production environment
  process.env.NODE_ENV = 'production';
  
  logger.bigLog('BUILDING WITH SERVER ISLANDS 🏝️', { color: 'green' });
  logger.info('🔥 OPTIONAL SERVER CONTENT - THE GAME CHANGER');
  
  if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });
  if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(buildDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  
  const startTime = process.hrtime.bigint(); // Microsecond precision
  
  try {
    logger.info('Step 0: Loading environment variables...');
    const envVars = loadEnvVariables(root);
    
    const { loadConfig } = await import('./config/loadConfig.js');
    const config = await loadConfig(root);
    
    logger.info('Step 1: Compiling and detecting Server Islands...');
    const { routes, serverIslands, clientRoutes } = await compileForBuild(root, buildDir, envVars);
    
    if (serverIslands.length > 0) {
      logger.bigLog('SERVER ISLANDS DETECTED 🏝️', { color: 'cyan' });
      logger.table(serverIslands.map(r => ({
        route: r.route,
        file: r.file,
        mode: '🏝️ Server Island (SSG)'
      })));
    }
    
    logger.info('Step 2: Processing SCSS/SASS...');
    await processSCSS(root, buildDir);
    
    logger.info('Step 3: Combining CSS...');
    await buildAllCSS(root, outDir);
    
    logger.info('Step 4: Copying static assets...');
    await copyAllStaticAssets(root, outDir);
    
    logger.info('Step 5: Bundling JavaScript with Router...');
    const buildEntry = join(buildDir, 'main.js');
    const routerPath = join(buildDir, 'router.js');
    
    if (!existsSync(buildEntry)) {
      logger.error('❌ main.js not found in build directory!');
      throw new Error('Build entry point missing');
    }
    
    const result = await bundleJavaScript(buildEntry, routerPath, outDir, envVars, buildDir);
    
    logger.info('Step 6: Generating HTML with Server Islands...');
    await generateProductionHTML(root, outDir, result, routes, serverIslands, config);
    
    logger.info('Step 7: Generating sitemap.xml...');
    await generateSitemap(routes, config, outDir);
    
    logger.info('Step 8: Generating robots.txt...');
    await generateRobots(config, outDir, routes);
    
    // Clean up build directory
    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });
    
    const endTime = process.hrtime.bigint();
    const durationMicro = Number(endTime - startTime) / 1000;
    const durationMs = durationMicro / 1000;
    
    showBuildSummary(routes, serverIslands, clientRoutes, durationMs, durationMicro);
    
    // ✅ FIX: Force exit after successful build
    // Small delay to ensure all logs are flushed
    setTimeout(() => {
      logger.info('✅ Build process complete, exiting...');
      process.exit(0);
    }, 100);
    
  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });
    
    // ✅ FIX: Force exit with error code
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
}

async function bundleJavaScript(buildEntry, routerPath, outDir, envVars, buildDir) {
  try {
    const hasRouter = existsSync(routerPath);
    
    const originalCwd = process.cwd();
    process.chdir(buildDir);
    
    logger.info('🔧 Bundling with production JSX...');
    
    const entrypoints = [buildEntry];
    if (hasRouter) {
      entrypoints.push(routerPath);
      logger.success('✅ Router included in bundle');
    }
    
    logger.info(`📦 Entry points: ${entrypoints.map(e => e.split('/').pop()).join(', ')}`);
    
    const result = await Bun.build({
      entrypoints,
      outdir: join(outDir, 'assets'),
      target: 'browser',
      minify: true,
      splitting: true,
      sourcemap: 'external',
      naming: {
        entry: '[name]-[hash].js',
        chunk: 'chunks/[name]-[hash].js',
        asset: '[name]-[hash].[ext]'
      },
      external: ['react', 'react-dom', 'react-dom/client'],
      define: {
        'process.env.NODE_ENV': '"production"',
        ...Object.fromEntries(
          Object.entries(envVars).map(([key, value]) => [
            `process.env.${key}`,
            JSON.stringify(value)
          ])
        )
      }
    });
    
    process.chdir(originalCwd);
    
    if (!result.success) {
      logger.error('❌ JavaScript build failed!');
      
      if (result.logs && result.logs.length > 0) {
        logger.error('\n📋 Build errors:');
        result.logs.forEach((log, i) => {
          logger.error(`\n${i + 1}. ${log.message}`);
          if (log.position) {
            logger.error(`   File: ${log.position.file || 'unknown'}`);
            logger.error(`   Line: ${log.position.line || 'unknown'}`);
            logger.error(`   Column: ${log.position.column || 'unknown'}`);
          }
          if (log.position && log.position.file && existsSync(log.position.file)) {
            try {
              const fileContent = Bun.file(log.position.file).text();
              const lines = fileContent.split('\n');
              const line = lines[log.position.line - 1];
              if (line) {
                logger.error(`   Code: ${line.trim()}`);
                logger.error(`         ${' '.repeat(log.position.column - 1)}^`);
              }
            } catch (e) {}
          }
        });
      } else {
        logger.error('No detailed logs available');
      }
      
      throw new Error('JavaScript bundling failed');
    }
    
    const entryPoints = result.outputs.filter(o => o.kind === 'entry-point');
    const chunks = result.outputs.filter(o => o.kind === 'chunk');
    
    logger.success('✅ JavaScript bundled successfully');
    logger.info(`   Entry points: ${entryPoints.length}`);
    logger.info(`   Chunks: ${chunks.length}`);
    
    result.outputs.forEach(output => {
      const size = (output.size / 1024).toFixed(2);
      logger.debug(`   📄 ${output.path.split('/').pop()} (${size} KB)`);
    });
    
    const totalSize = result.outputs.reduce((sum, o) => sum + (o.size || 0), 0);
    logger.info(`   Total size: ${(totalSize / 1024).toFixed(2)} KB`);
    
    return result;
    
  } catch (error) {
    logger.error('❌ Bundling error: ' + error.message);
    if (error.stack) {
      logger.error('Stack trace:');
      logger.error(error.stack);
    }
    throw error;
  }
}

async function processSCSS(root, buildDir) {
  const srcStylesDir = join(root, 'src', 'styles');
  if (!existsSync(srcStylesDir)) return;
  
  try {
    const sass = await import('sass').catch(() => {
      logger.warn('⚠️  sass package not installed. Install with: bun add sass');
      return null;
    });
    
    if (!sass) return;
    
    const { readdirSync } = await import('fs');
    const scssFiles = readdirSync(srcStylesDir).filter(f => 
      f.endsWith('.scss') || f.endsWith('.sass')
    );
    
    if (scssFiles.length === 0) return;
    
    logger.info(`📝 Processing ${scssFiles.length} SCSS/SASS files...`);
    
    for (const file of scssFiles) {
      const srcPath = join(srcStylesDir, file);
      const cssPath = join(buildDir, 'styles', file.replace(/\.(scss|sass)$/, '.css'));
      
      mkdirSync(join(buildDir, 'styles'), { recursive: true });
      
      const result = sass.compile(srcPath, {
        style: 'compressed',
        sourceMap: false,
        loadPaths: [srcStylesDir, join(root, 'node_modules')]
      });
      
      await Bun.write(cssPath, result.css);
      logger.debug(`   ${file} → ${file.replace(/\.(scss|sass)$/, '.css')}`);
    }
    
    logger.success(`✅ Processed ${scssFiles.length} SCSS files`);
  } catch (error) {
    logger.error(`SCSS processing failed: ${error.message}`);
  }
}

function showBuildSummary(routes, serverIslands, clientRoutes, durationMs, durationMicro) {
  logger.success(`✨ Build complete in ${durationMs.toFixed(3)}ms (${durationMicro.toFixed(0)}µs)`);
  logger.bigLog('BUILD SUMMARY', { color: 'green' });
  logger.info(`📄 Total routes: ${routes.length}`);
  logger.info(`🏝️  Server Islands (SSG): ${serverIslands.length}`);
  logger.info(`⚡ Client-only: ${clientRoutes.length}`);
  logger.info(`🗺️  Sitemap: dist/sitemap.xml`);
  logger.info(`🤖 robots.txt: dist/robots.txt`);
  
  const cacheStats = globalCache.getStats();
  logger.info(`📊 Cache: ${cacheStats.hitRate} hit rate (${cacheStats.hits}/${cacheStats.hits + cacheStats.misses})`);
  
  if (serverIslands.length > 0) {
    logger.success('✅ Server Islands enabled - INSTANT content delivery!');
  }
  
  logger.bigLog('READY TO DEPLOY 🚀', { color: 'green' });
  
  // ✅ Force log flush
  logger.debug('Build complete, exiting...');
}