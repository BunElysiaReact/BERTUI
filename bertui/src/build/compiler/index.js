// bertui/src/build/compiler/index.js
import { join } from 'path';
import { existsSync } from 'fs';
import logger from '../../logger/logger.js';
import { discoverRoutes } from './route-discoverer.js';
import { compileBuildDirectory } from './file-transpiler.js';
import { generateBuildRouter } from './router-generator.js';

export async function compileForBuild(root, buildDir, envVars, config = {}) {
  const srcDir   = join(root, 'src');
  const pagesDir = join(srcDir, 'pages');

  if (!existsSync(srcDir)) {
    throw new Error('src/ directory not found!');
  }

  const importhow = config.importhow || {};
  let routes = [];

  if (existsSync(pagesDir)) {
    routes = await discoverRoutes(pagesDir);
  }

  await compileBuildDirectory(srcDir, buildDir, root, envVars, importhow);

  if (routes.length > 0) {
    await generateBuildRouter(routes, buildDir);
  }

  return { routes };
}