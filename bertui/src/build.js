// src/build.js
import { join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';
import logger from './logger/logger.js';

export async function buildProduction(options = {}) {
  const root = options.root || process.cwd();
  const outDir = join(root, 'dist');
  
  logger.bigLog('BUILDING FOR PRODUCTION', { color: 'green' });
  
  // Clean dist folder
  if (existsSync(outDir)) {
    rmSync(outDir, { recursive: true });
    logger.info('Cleaned dist/');
  }
  mkdirSync(outDir, { recursive: true });
  
  const startTime = Date.now();
  
  try {
    // Build with Bun's bundler
    const result = await Bun.build({
      entrypoints: [join(root, 'src/main.jsx')],
      outdir: outDir,
      target: 'browser',
      minify: true,
      splitting: true,
      sourcemap: 'external',
      naming: {
        entry: '[name]-[hash].js',
        chunk: 'chunks/[name]-[hash].js',
        asset: 'assets/[name]-[hash].[ext]'
      }
    });
    
    if (!result.success) {
      logger.error('Build failed!');
      result.logs.forEach(log => logger.error(log.message));
      process.exit(1);
    }
    
    // Copy BertUI CSS to dist
    const bertuiCss = join(import.meta.dir, 'styles/bertui.css');
    const destCss = join(outDir, 'bertui.css');
    await Bun.write(destCss, Bun.file(bertuiCss));
    logger.info('Copied BertUI CSS');
    
    // Generate index.html
    await generateProductionHTML(root, outDir, result);
    
    const duration = Date.now() - startTime;
    logger.success(`Build complete in ${duration}ms`);
    logger.info(`Output: ${outDir}`);
    logger.table(result.outputs.map(o => ({
      file: o.path,
      size: `${(o.size / 1024).toFixed(2)} KB`
    })));
    
  } catch (error) {
    logger.error(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

async function generateProductionHTML(root, outDir, buildResult) {
  // Find the main bundle
  const mainBundle = buildResult.outputs.find(o => 
    o.path.includes('main') && o.kind === 'entry-point'
  );
  
  if (!mainBundle) {
    throw new Error('Could not find main bundle');
  }
  
  const bundleName = mainBundle.path.split('/').pop();
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BertUI App</title>
  <link rel="stylesheet" href="/bertui.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/${bundleName}"></script>
</body>
</html>`;
  
  await Bun.write(join(outDir, 'index.html'), html);
  logger.info('Generated index.html');
}