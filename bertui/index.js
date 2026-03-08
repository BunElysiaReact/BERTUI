// bertui/index.js - v1.3.0

// Compiler
export { compileProject, compileFile } from './src/client/compiler.js';
export { compileForBuild } from './src/build/compiler/index.js';
export { discoverRoutes } from './src/build/compiler/route-discoverer.js';

// HMR
export { hmr } from './src/client/hmr-runtime.js';

// Image Optimizer
export {
  optimizeImage,
  optimizeImagesBatch,
  hasWasm,
  version as optimizerVersion,
} from './src/image-optimizer/index.js';

// Build
export { buildProduction } from './src/build.js';
export { optimizeImages } from './src/build/image-optimizer.js';

// Router
export { Router, Link, useRouter } from './src/router/index.js';
export { SSRRouter } from './src/router/SSRRouter.js';

// Config
export { loadConfig, defaultConfig } from './src/config/index.js';

// Logger
export { default as logger } from './src/logger/logger.js';

// CLI
export { program } from './src/cli.js';

// ✅ Middleware system
export {
  MiddlewareManager,
  loadMiddleware,
  runMiddleware,
  MiddlewareContext,
} from './src/middleware/index.js';

// ✅ Layout system
export {
  discoverLayouts,
  compileLayouts,
  matchLayout,
  generateLayoutWrapper,
  injectLayoutsIntoRouter,
} from './src/layouts/index.js';

// ✅ Loading states
export {
  discoverLoadingComponents,
  compileLoadingComponents,
  generateLoadingAwareRouter,
  getLoadingScript,
  DEFAULT_LOADING_HTML,
} from './src/loading/index.js';

// ✅ Partial hydration
export {
  needsHydration,
  getInteractiveFeatures,
  analyzeRoutes,
  generatePartialHydrationCode,
  logHydrationReport,
} from './src/hydration/index.js';

// ✅ Bundle analyzer
export { analyzeBuild } from './src/analyzer/index.js';

// ✅ CLI scaffolder
export { scaffold, parseCreateArgs } from './src/scaffolder/index.js';

// Server
export { createDevHandler } from './src/server/dev-handler.js';
export { startDevServer } from './src/server/dev-server.js';

// CSS
export { minifyCSS, combineCSS } from './src/css/processor.js';

// Images
export { copyImagesSync, isImageFile } from './src/images/index.js';

// Server Islands
export {
  extractStaticHTML,
  isServerIsland,
  validateServerIsland,
} from './src/server-islands/index.js';

// ✅ NEW: importhow — alias/import resolution system
// Bunny and external tools can use these to apply the same alias logic
export {
  buildAliasMap,
  rewriteAliasImports,
  getAliasDirs,
} from './src/utils/importhow.js';

// Version
export const version = '1.2.2';