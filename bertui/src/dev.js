// bertui/src/dev.js - CLEANED (No PageBuilder)
import { compileProject } from './client/compiler.js';
import { startDevServer } from './server/dev-server.js';
import logger from './logger/logger.js';
import { loadConfig } from './config/loadConfig.js';

export async function startDev(options = {}) {
  const root = options.root || process.cwd();
  const port = options.port || 3000;
  
  try {
    const config = await loadConfig(root);
    
    // Step 1: Compile project
    logger.info('Step 1: Compiling project...');
    await compileProject(root);
    
    // Step 2: Start dev server
    logger.info('Step 2: Starting dev server...');
    await startDevServer({ root, port });
    
  } catch (error) {
    logger.error(`Dev server failed: ${error.message}`);
    process.exit(1);
  }
}