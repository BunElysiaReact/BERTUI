// bertui/src/compiler/index.js - NEW FILE (PURE, NO SERVER)
export { compileProject } from '../client/compiler.js';
export { compileForBuild } from '../build/compiler/index.js';
export { discoverRoutes } from '../build/compiler/route-discoverer.js';
export { validateServerIsland } from '../build/server-island-validator.js';

// PURE JSX→JS TRANSFORMATION
export async function transformJSX(sourceCode, options = {}) {
  const transpiler = new Bun.Transpiler({
    loader: options.loader || 'tsx',
    target: 'browser',
    define: {
      'process.env.NODE_ENV': JSON.stringify(options.env || 'development')
    }
  });
  return await transpiler.transform(sourceCode);
}

// Export everything from this directory
export { transformJSX, transformJSXSync, containsJSX, removeCSSImports, removeDotenvImports, fixRelativeImports } from './transform.js';
export { generateRouterCode } from './router-generator-pure.js';
// Re-export existing
export { compileProject } from '../client/compiler.js';
export { compileForBuild } from '../build/compiler/index.js';
export { discoverRoutes } from '../build/compiler/route-discoverer.js';