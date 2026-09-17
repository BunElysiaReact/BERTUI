// bertui/src/build/compiler/index.js
import { join } from 'path';
import { existsSync } from 'fs';
import logger from '../../logger/logger.js';
import { discoverRoutes } from './route-discoverer.js';
import { compileBuildDirectory } from './file-transpiler.js';
import { generateBuildRouter } from './router-generator.js';
import { discoverMarkdownRoutes, compileMarkdownDirectory } from '../../md/index.js';

export async function compileForBuild(root, buildDir, envVars, config = {}) {
  const srcDir   = join(root, 'src');
  const pagesDir = join(srcDir, 'pages');

  if (!existsSync(srcDir)) {
    throw new Error('src/ directory not found!');
  }

  const importhow = config.importhow || {};
  let routes = [];

  if (existsSync(pagesDir)) {
    // Discover JSX/TSX routes
    routes = await discoverRoutes(pagesDir);
    
    // Discover Markdown routes
    const mdRoutes = await discoverMarkdownRoutes(pagesDir);
    routes = [...routes, ...mdRoutes];
    
    logger.info(`Discovered ${routes.length} total routes (${mdRoutes.length} markdown)`);
  }

  // Compile source files (JSX/TSX/JS)
  await compileBuildDirectory(srcDir, buildDir, root, envVars, importhow);
  
  // Compile markdown files
  if (existsSync(pagesDir)) {
    logger.info('📝 Compiling markdown files...');
    await compileMarkdownDirectory(pagesDir, join(buildDir, 'pages'), root, envVars, new Map());
  }

  if (routes.length > 0) {
    await generateBuildRouter(routes, buildDir);
  }

  return { routes };
}