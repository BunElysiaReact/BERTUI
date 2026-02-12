// bertui/src/index.js - ONE EXPORT FILE TO RULE THEM ALL

// Compiler
export { compileProject } from './client/compiler.js';
export { compileForBuild } from './build/compiler/index.js';
export { discoverRoutes } from './build/compiler/route-discoverer.js';

// HMR
export { hmr } from './client/hmr-runtime.js';

// Image Optimizer - RUST WASM (no Rust for users)
export { 
  optimizeImage, 
  optimizeImagesBatch, 
  hasWasm, 
  version as optimizerVersion 
} from './image-optimizer/index.js';

// Build
export { buildProduction } from './build.js';
export { optimizeImages } from './build/image-optimizer.js';

// Router
export { Router, Link, useRouter } from './router/index.js';
export { SSRRouter } from './router/SSRRouter.jsx';

// Config
export { loadConfig, defaultConfig } from './config/index.js';

// Logger
export { default as logger } from './logger/logger.js';

// CLI (backward compatibility)
export { program } from './cli.js';

// Version
export const version = '1.2.0';

// Default export
export default {
  compileProject,
  compileForBuild,
  discoverRoutes,
  hmr,
  optimizeImage,
  optimizeImagesBatch,
  optimizeImages,
  buildProduction,
  Router,
  Link,
  useRouter,
  SSRRouter,
  loadConfig,
  defaultConfig,
  logger,
  program,
  version: '1.2.0'
};