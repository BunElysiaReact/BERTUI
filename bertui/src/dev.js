// bertui/src/dev.js - WITH MIDDLEWARE + LAYOUTS + LOADING + PARTIAL HYDRATION
import { compileProject } from './client/compiler.js';
import { startDevServer } from './server/dev-server.js';
import { MiddlewareManager } from './middleware/index.js';
import { compileLayouts, discoverLayouts } from './layouts/index.js';
import { compileLoadingComponents } from './loading/index.js';
import { analyzeRoutes, logHydrationReport } from './hydration/index.js';
import logger from './logger/logger.js';
import { loadConfig } from './config/loadConfig.js';

export async function startDev(options = {}) {
  const root = options.root || process.cwd();
  const port = options.port || 3000;

  try {
    const config = await loadConfig(root);

    // Step 1: Compile project
    logger.info('Step 1: Compiling project...');
    const { routes, outDir } = await compileProject(root);

    // Step 2: Compile layouts
    logger.info('Step 2: Loading layouts...');
    const layouts = await compileLayouts(root, outDir);
    const layoutCount = Object.keys(layouts).length;
    if (layoutCount > 0) {
      logger.success(`📐 ${layoutCount} layout(s) active`);
    } else {
      logger.info('No layouts found (create src/layouts/default.tsx to wrap all pages)');
    }

    // Step 3: Compile loading states
    logger.info('Step 3: Loading per-route loading states...');
    const loadingComponents = await compileLoadingComponents(root, outDir);

    // Step 4: Analyze routes for partial hydration
    if (routes && routes.length > 0) {
      logger.info('Step 4: Analyzing routes for partial hydration...');
      const analyzedRoutes = await analyzeRoutes(routes);
      logHydrationReport(analyzedRoutes);
    }

    // Step 5: Load middleware
    logger.info('Step 5: Loading middleware...');
    const middlewareManager = new MiddlewareManager(root);
    await middlewareManager.load();
    middlewareManager.watch(); // Hot-reload middleware on change

    // Step 6: Start dev server with all features
    logger.info('Step 6: Starting dev server...');
    await startDevServer({
      root,
      port,
      middleware: middlewareManager,
      layouts,
      loadingComponents,
    });

  } catch (error) {
    logger.error(`Dev server failed: ${error.message}`);
    if (error.stack) logger.error(error.stack);
    process.exit(1);
  }
}