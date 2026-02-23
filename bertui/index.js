// bertui/index.js - v1.2.0 with all features

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

// ✅ NEW: Middleware system
export {
  MiddlewareManager,
  loadMiddleware,
  runMiddleware,
  MiddlewareContext,
} from './src/middleware/index.js';

// ✅ NEW: Layout system
export {
  discoverLayouts,
  compileLayouts,
  matchLayout,
  generateLayoutWrapper,
  injectLayoutsIntoRouter,
} from './src/layouts/index.js';

// ✅ NEW: Loading states
export {
  discoverLoadingComponents,
  compileLoadingComponents,
  generateLoadingAwareRouter,
  getLoadingScript,
  DEFAULT_LOADING_HTML,
} from './src/loading/index.js';

// ✅ NEW: Partial hydration
export {
  needsHydration,
  getInteractiveFeatures,
  analyzeRoutes,
  generatePartialHydrationCode,
  logHydrationReport,
} from './src/hydration/index.js';

// ✅ NEW: Bundle analyzer
export { analyzeBuild } from './src/analyzer/index.js';

// ✅ NEW: CLI scaffolder
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

// Version
export const version = '1.2.0';