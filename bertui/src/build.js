// bertui/src/build.js - CLEANED (No PageBuilder)
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import logger from './logger/logger.js';
import { loadEnvVariables } from './utils/env.js';

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
  
  if (existsSync(buildDir)) rmSync(buildDir, { recursive: true });
  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  mkdirSync(buildDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  
  const startTime = Date.now();
  
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
    
    logger.info('Step 2: Combining CSS...');
    await buildAllCSS(root, outDir);
    
    logger.info('Step 3: Copying static assets...');
    await copyAllStaticAssets(root, outDir);
    
    logger.info('Step 4: Bundling JavaScript...');
    const buildEntry = join(buildDir, 'main.js');
    
    if (!existsSync(buildEntry)) {
      logger.error('❌ main.js not found in build directory!');
      throw new Error('Build entry point missing');
    }
    
    const result = await bundleJavaScript(buildEntry, outDir, envVars, buildDir);
    
    logger.info('Step 5: Generating HTML with Server Islands...');
    await generateProductionHTML(root, outDir, result, routes, serverIslands, config);
    
    logger.info('Step 6: Generating sitemap.xml...');
    await generateSitemap(routes, config, outDir);
    
    logger.info('Step 7: Generating robots.txt...');
    await generateRobots(config, outDir, routes);
    
    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true });
    
    const duration = Date.now() - startTime;
    showBuildSummary(routes, serverIslands, clientRoutes, duration);
    
  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true });
    process.exit(1);
  }
}

async function bundleJavaScript(buildEntry, outDir, envVars, buildDir) {
  try {
    const originalCwd = process.cwd();
    process.chdir(buildDir);
    
    logger.info('🔧 Bundling with production JSX...');
    
    const result = await Bun.build({
      entrypoints: [buildEntry],
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
          }
        });
      }
      
      throw new Error('JavaScript bundling failed');
    }
    
    logger.success('✅ JavaScript bundled successfully');
    logger.info(`   Entry points: ${result.outputs.filter(o => o.kind === 'entry-point').length}`);
    logger.info(`   Chunks: ${result.outputs.filter(o => o.kind === 'chunk').length}`);
    
    const totalSize = result.outputs.reduce((sum, o) => sum + (o.size || 0), 0);
    logger.info(`   Total size: ${(totalSize / 1024).toFixed(2)} KB`);
    
    return result;
    
  } catch (error) {
    logger.error('❌ Bundling error: ' + error.message);
    throw error;
  }
}

function showBuildSummary(routes, serverIslands, clientRoutes, duration) {
  logger.success(`✨ Build complete in ${duration}ms`);
  logger.bigLog('BUILD SUMMARY', { color: 'green' });
  logger.info(`📄 Total routes: ${routes.length}`);
  logger.info(`🏝️  Server Islands (SSG): ${serverIslands.length}`);
  logger.info(`⚡ Client-only: ${clientRoutes.length}`);
  logger.info(`🗺️  Sitemap: dist/sitemap.xml`);
  logger.info(`🤖 robots.txt: dist/robots.txt`);
  
  if (serverIslands.length > 0) {
    logger.success('✅ Server Islands enabled - INSTANT content delivery!');
  }
  
  logger.bigLog('READY TO DEPLOY 🚀', { color: 'green' });
}