// bertui/src/build/compiler/index.js - WITH IMPORTHOW + NODE MODULE SUPPORT
import { join } from 'path';
import { existsSync } from 'fs';
import logger from '../../logger/logger.js';
import { discoverRoutes } from './route-discoverer.js';
import { compileBuildDirectory } from './file-transpiler.js';
import { generateBuildRouter } from './router-generator.js';

/**
 * @param {string} root
 * @param {string} buildDir
 * @param {Object} envVars
 * @param {Object} config    - full bertui config (includes importhow)
 */
export async function compileForBuild(root, buildDir, envVars, config = {}) {
  const srcDir  = join(root, 'src');
  const pagesDir = join(srcDir, 'pages');

  if (!existsSync(srcDir)) {
    throw new Error('src/ directory not found!');
  }

  const importhow = config.importhow || {};

  let routes       = [];
  let serverIslands = [];
  let clientRoutes  = [];

  if (existsSync(pagesDir)) {
    routes = await discoverRoutes(pagesDir);

    for (const route of routes) {
      const sourceCode = await Bun.file(route.path).text();
      const isServerIsland = sourceCode.includes('export const render = "server"');

      if (isServerIsland) {
        serverIslands.push(route);
        logger.success(`🏝️  Server Island: ${route.route}`);
      } else {
        clientRoutes.push(route);
      }
    }
  }

  // Pass importhow so alias dirs also get compiled
  await compileBuildDirectory(srcDir, buildDir, root, envVars, importhow);

  if (routes.length > 0) {
    await generateBuildRouter(routes, buildDir);
  }

  return { routes, serverIslands, clientRoutes };
}