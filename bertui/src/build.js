// bertui/src/build.js - WITH LAYOUTS + LOADING + PARTIAL HYDRATION + ANALYZER + IMPORTHOW + NODE_MODULES SUPPORT
import { join } from 'path';
import { existsSync, mkdirSync, rmSync, readdirSync, statSync } from 'fs';
import logger from './logger/logger.js';
import { loadEnvVariables } from './utils/env.js';
import { globalCache } from './utils/cache.js';

import { compileForBuild } from './build/compiler/index.js';
import { buildAllCSS } from './build/processors/css-builder.js';
import { copyAllStaticAssets } from './build/processors/asset-processor.js';
import { generateProductionHTML } from './build/generators/html-generator.js';
import { generateSitemap } from './build/generators/sitemap-generator.js';
import { generateRobots } from './build/generators/robots-generator.js';
import { compileLayouts } from './layouts/index.js';
import { compileLoadingComponents } from './loading/index.js';
import { analyzeRoutes, logHydrationReport } from './hydration/index.js';
import { analyzeBuild } from './analyzer/index.js';
import { buildAliasMap, getAliasDirs } from './utils/importhow.js';

export async function buildProduction(options = {}) {
  const root     = options.root || process.cwd();
  const buildDir = join(root, '.bertuibuild');
  const outDir   = join(root, 'dist');

  process.env.NODE_ENV = 'production';

  logger.bigLog('BUILDING WITH SERVER ISLANDS 🏝️', { color: 'green' });

  if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });
  if (existsSync(outDir))   rmSync(outDir,   { recursive: true, force: true });
  mkdirSync(buildDir, { recursive: true });
  mkdirSync(outDir,   { recursive: true });

  const startTime = process.hrtime.bigint();

  try {
    logger.info('Step 0: Loading environment variables...');
    const envVars = loadEnvVariables(root);

    const { loadConfig } = await import('./config/loadConfig.js');
    const config = await loadConfig(root);

    // Log importhow aliases if any
    const importhow = config.importhow || {};
    const aliasCount = Object.keys(importhow).length;
    if (aliasCount > 0) {
      logger.info(`🔗 importhow: ${aliasCount} alias(es) → ${Object.keys(importhow).join(', ')}`);
    }

    logger.info('Step 1: Compiling project...');
    // ✅ Pass full config so compileForBuild gets importhow
    const { routes, serverIslands, clientRoutes } = await compileForBuild(root, buildDir, envVars, config);

    if (serverIslands.length > 0) {
      logger.bigLog('SERVER ISLANDS DETECTED 🏝️', { color: 'cyan' });
      logger.table(serverIslands.map(r => ({
        route: r.route,
        file:  r.file,
        mode:  '🏝️ Server Island (SSG)',
      })));
    }

    logger.info('Step 2: Compiling layouts...');
    const layouts = await compileLayouts(root, buildDir);
    const layoutCount = Object.keys(layouts).length;
    if (layoutCount > 0) logger.success(`📐 ${layoutCount} layout(s) compiled`);

    logger.info('Step 3: Compiling loading states...');
    const loadingComponents = await compileLoadingComponents(root, buildDir);

    logger.info('Step 4: Analyzing routes for partial hydration...');
    const analyzedRoutes = await analyzeRoutes(routes);
    logHydrationReport(analyzedRoutes);

    logger.info('Step 5: Processing CSS...');
    await buildAllCSS(root, outDir);

    logger.info('Step 6: Copying static assets...');
    await copyAllStaticAssets(root, outDir);

    logger.info('Step 7: Bundling JavaScript...');
    const buildEntry  = join(buildDir, 'main.js');
    const routerPath  = join(buildDir, 'router.js');

    if (!existsSync(buildEntry)) {
      throw new Error('Build entry point missing (main.js not found in build dir)');
    }

    const result = await bundleJavaScript(buildEntry, routerPath, outDir, envVars, buildDir, analyzedRoutes, importhow, root, config);

    logger.info('Step 8: Generating HTML...');
    await generateProductionHTML(root, outDir, result, routes, serverIslands, config);

    logger.info('Step 9: Generating sitemap.xml...');
    await generateSitemap(routes, config, outDir);

    logger.info('Step 10: Generating robots.txt...');
    await generateRobots(config, outDir, routes);

    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });

    const endTime    = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;

    showBuildSummary(routes, serverIslands, clientRoutes, analyzedRoutes, durationMs);

    logger.info('Generating bundle report...');
    await analyzeBuild(outDir, { outputFile: join(outDir, 'bundle-report.html') });

    // ✅ FIX: Don't exit here, let the function complete naturally
    logger.success('✅ Build complete!');
    
    // Return success instead of exiting
    return { success: true, duration: durationMs };

  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    if (existsSync(buildDir)) rmSync(buildDir, { recursive: true, force: true });
    
    // ✅ FIX: Throw the error instead of exiting
    throw error;
  }
}

// NEW FUNCTION: Generate import map for production
async function generateProductionImportMap(root, config) {
  const importMap = {
    "react": "https://esm.sh/react@18.2.0",
    "react-dom": "https://esm.sh/react-dom@18.2.0",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0/client"
  };
  
  // Auto-detect node_modules packages for production
  const nodeModulesDir = join(root, 'node_modules');
  
  if (existsSync(nodeModulesDir)) {
    try {
      const packages = readdirSync(nodeModulesDir);
      
      for (const pkg of packages) {
        // Skip system directories and already handled packages
        if (pkg.startsWith('.') || pkg.startsWith('_')) continue;
        if (pkg === 'react' || pkg === 'react-dom') continue;
        if (pkg.includes('@')) continue; // Skip scoped packages for now
        
        const pkgDir = join(nodeModulesDir, pkg);
        
        try {
          const stat = statSync(pkgDir);
          if (!stat.isDirectory()) continue;
        } catch {
          continue;
        }
        
        const pkgJsonPath = join(pkgDir, 'package.json');
        if (!existsSync(pkgJsonPath)) continue;
        
        try {
          const pkgJsonContent = await Bun.file(pkgJsonPath).text();
          const pkgJson = JSON.parse(pkgJsonContent);
          
          // Look for browser-ready entry points
          const possibleEntryPoints = [
            pkgJson.browser,
            pkgJson.module,
            pkgJson.main,
            'dist/index.js',
            'lib/index.js',
            'index.js'
          ].filter(Boolean);
          
          let foundPath = null;
          for (const entry of possibleEntryPoints) {
            const fullPath = join(pkgDir, entry);
            if (existsSync(fullPath)) {
              // In production, we'll copy node_modules to dist/assets/node_modules/
              foundPath = `/assets/node_modules/${pkg}/${entry}`;
              break;
            }
          }
          
          if (foundPath) {
            importMap[pkg] = foundPath;
            logger.debug(`📦 Production map: ${pkg} → ${foundPath}`);
          }
          
        } catch (error) {
          // Silently skip packages we can't parse
          continue;
        }
      }
    } catch (error) {
      logger.warn(`Failed to scan node_modules for production: ${error.message}`);
    }
  }
  
  return importMap;
}

// NEW FUNCTION: Copy node_modules to dist
async function copyNodeModulesToDist(root, outDir, importMap) {
  const assetsNodeModulesDir = join(outDir, 'assets', 'node_modules');
  mkdirSync(assetsNodeModulesDir, { recursive: true });
  
  const nodeModulesDir = join(root, 'node_modules');
  const copied = new Set();
  
  for (const [pkg, assetPath] of Object.entries(importMap)) {
    if (pkg === 'react' || pkg === 'react-dom' || pkg === 'react-dom/client') continue;
    
    // Extract the relative path from the import map
    const match = assetPath.match(/\/assets\/node_modules\/(.+)$/);
    if (!match) continue;
    
    const relPath = match[1];
    const [pkgName, ...subPath] = relPath.split('/');
    const sourceFile = join(nodeModulesDir, pkgName, ...subPath);
    const destFile = join(assetsNodeModulesDir, pkgName, ...subPath);
    
    // Create destination directory
    const destDir = join(assetsNodeModulesDir, pkgName, ...subPath.slice(0, -1));
    mkdirSync(destDir, { recursive: true });
    
    try {
      if (existsSync(sourceFile)) {
        await Bun.write(destFile, Bun.file(sourceFile));
        if (!copied.has(pkgName)) {
          logger.debug(`📋 Copied ${pkgName} to dist/assets/node_modules/`);
          copied.add(pkgName);
        }
      }
    } catch (error) {
      logger.warn(`⚠️  Failed to copy ${pkgName}: ${error.message}`);
    }
  }
  
  if (copied.size > 0) {
    logger.success(`✅ Copied ${copied.size} node_modules to dist/assets/node_modules/`);
  }
}

async function bundleJavaScript(buildEntry, routerPath, outDir, envVars, buildDir, analyzedRoutes, importhow, root, config) {
  const originalCwd = process.cwd();
  process.chdir(buildDir);

  try {
    const hasRouter  = existsSync(routerPath);
    const entrypoints = [buildEntry];
    if (hasRouter) entrypoints.push(routerPath);

    // Generate import map for production
    const importMap = await generateProductionImportMap(root, config);
    
    // Save import map to dist
    const importMapPath = join(outDir, 'import-map.json');
    await Bun.write(importMapPath, JSON.stringify({ imports: importMap }, null, 2));
    logger.success(`✅ Generated import map: import-map.json`);

    // Copy node_modules to dist
    await copyNodeModulesToDist(root, outDir, importMap);

    // ── Node module support ───────────────────────────────────────────────
    // Only react packages stay external (loaded via importmap)
    const alwaysExternal = ['react', 'react-dom', 'react-dom/client'];

    const result = await Bun.build({
      entrypoints,
      outdir:   join(outDir, 'assets'),
      target:   'browser',
      minify:   true,
      splitting: true,
      sourcemap: 'external',
      metafile:  true,
      naming: {
        entry: 'js/[name]-[hash].js',
        chunk: 'js/chunks/[name]-[hash].js',
        asset: 'assets/[name]-[hash].[ext]',
      },
      external: alwaysExternal,
      define: {
        'process.env.NODE_ENV': '"production"',
        ...Object.fromEntries(
          Object.entries(envVars).map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)])
        ),
      },
    });

    if (!result.success) {
      const errors = result.logs?.map(l => l.message).join('\n') || 'Unknown error';
      throw new Error(`JavaScript bundling failed:\n${errors}`);
    }

    logger.success(`✅ Bundled ${result.outputs.length} files`);
    
    // Save metafile for analysis
    if (result.metafile) {
      const metafilePath = join(outDir, 'metafile.json');
      await Bun.write(metafilePath, JSON.stringify(result.metafile, null, 2));
      logger.success(`✅ Generated bundle metadata: metafile.json`);
    }
    
    return result;

  } catch (error) {
    logger.error(`Bundle failed: ${error.message}`);
    throw error;
  } finally {
    process.chdir(originalCwd);
  }
}

function showBuildSummary(routes, serverIslands, clientRoutes, analyzedRoutes, durationMs) {
  logger.success(`✨ Build complete in ${durationMs.toFixed(1)}ms`);
  logger.bigLog('BUILD SUMMARY', { color: 'green' });
  logger.info(`📄 Total routes:             ${routes.length}`);
  logger.info(`🏝️  Server Islands (SSG):    ${serverIslands.length}`);
  logger.info(`⚡ Interactive (hydrated):   ${analyzedRoutes.interactive.length}`);
  logger.info(`🧊 Static (no JS):           ${analyzedRoutes.static.length}`);
  logger.info(`🗺️  Sitemap:                 dist/sitemap.xml`);
  logger.info(`🤖 robots.txt:               dist/robots.txt`);
  logger.info(`📊 Bundle report:            dist/bundle-report.html`);
  logger.info(`📦 Import map:               dist/import-map.json`);
  logger.info(`📁 Node modules:             dist/assets/node_modules/`);
  logger.bigLog('READY TO DEPLOY 🚀', { color: 'green' });
}

// Update the main export to handle the process properly
export async function build(options = {}) {
  try {
    await buildProduction(options);
    // ✅ Let the process exit naturally
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}