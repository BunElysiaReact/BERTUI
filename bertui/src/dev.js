// bertui/src/dev.js
import { compileProject } from './client/compiler.js';
import { startDevServer } from './server/dev-server.js';
import { MiddlewareManager } from './middleware/index.js';
import { compileLayouts } from './layouts/index.js';
import { compileLoadingComponents } from './loading/index.js';
import { analyzeRoutes, logHydrationReport } from './hydration/index.js';
import logger from './logger/logger.js';
import { loadConfig } from './config/loadConfig.js';

const TOTAL_STEPS = 6;

export async function startDev(options = {}) {
  const root = options.root || process.cwd();
  const port = options.port || 3000;

  logger.printHeader('DEV');

  try {
    const config = await loadConfig(root);

    // ── Step 1: Compile ──────────────────────────────────────────────────────
    logger.step(1, TOTAL_STEPS, 'Compiling');
    const { routes, outDir } = await compileProject(root);
    logger.stepDone('Compiling', `${routes.length} routes`);

    // ── Step 2: Layouts ──────────────────────────────────────────────────────
    logger.step(2, TOTAL_STEPS, 'Layouts');
    const layouts = await compileLayouts(root, outDir);
    const layoutCount = Object.keys(layouts).length;
    logger.stepDone('Layouts', layoutCount > 0 ? `${layoutCount} found` : 'none');

    // ── Step 3: Loading states ───────────────────────────────────────────────
    logger.step(3, TOTAL_STEPS, 'Loading states');
    const loadingComponents = await compileLoadingComponents(root, outDir);
    logger.stepDone('Loading states');

    // ── Step 4: Hydration analysis ───────────────────────────────────────────
    logger.step(4, TOTAL_STEPS, 'Hydration analysis');
    if (routes && routes.length > 0) {
      const analyzedRoutes = await analyzeRoutes(routes);
      logger.stepDone('Hydration analysis',
        `${analyzedRoutes.interactive.length} interactive · ${analyzedRoutes.static.length} static`);
    } else {
      logger.stepDone('Hydration analysis', 'no routes');
    }

    // ── Step 5: Middleware ───────────────────────────────────────────────────
    logger.step(5, TOTAL_STEPS, 'Middleware');
    const middlewareManager = new MiddlewareManager(root);
    await middlewareManager.load();
    middlewareManager.watch();
    logger.stepDone('Middleware');

    // ── Step 6: Dev server ───────────────────────────────────────────────────
    logger.step(6, TOTAL_STEPS, 'Starting server');
    await startDevServer({ root, port, middleware: middlewareManager, layouts, loadingComponents });
    logger.stepDone('Starting server', `http://localhost:${port}`);

    // ── Ready ────────────────────────────────────────────────────────────────
    process.stdout.write(`\n  ${'\x1b[1m'}\x1b[32m▶  Ready on http://localhost:${port}\x1b[0m\n\n`);

  } catch (error) {
    logger.stepFail('Dev server', error.message);
    logger.error(error.stack || error.message);
    process.exit(1);
  }
}