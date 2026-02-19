// bertui/src/cli.js - WITH SERVE COMMAND
import { startDev } from './dev.js';
import { buildProduction } from './build.js';
import { startPreviewServer } from './serve.js'; // NEW
import logger from './logger/logger.js';

export function program() {
  const args = process.argv.slice(2);
  const command = args[0] || 'dev';

  switch (command) {
    case 'dev':
      const devPort = getArg('--port', '-p') || 3000;
      startDev({ 
        port: parseInt(devPort), 
        root: process.cwd() 
      });
      break;
    
    case 'build':
      buildProduction({ 
        root: process.cwd() 
      });
      break;
    
    // ✅ NEW: Serve command for production preview
    case 'serve':
    case 'preview':
      const previewPort = getArg('--port', '-p') || 5000;
      startPreviewServer({
        port: parseInt(previewPort),
        root: process.cwd(),
        dir: 'dist' // Default to dist folder
      });
      break;
    
    case '--version':
    case '-v':
      console.log('bertui v1.1.9');
      break;
    
    case '--help':
    case '-h':
      showHelp();
      break;
    
    default:
      logger.error(`Unknown command: ${command}`);
      showHelp();
  }
}

function getArg(longForm, shortForm) {
  const args = process.argv.slice(2);
  const longIndex = args.indexOf(longForm);
  const shortIndex = args.indexOf(shortForm);
  const index = longIndex !== -1 ? longIndex : shortIndex;
  return index !== -1 && args[index + 1] ? args[index + 1] : null;
}

function showHelp() {
  logger.bigLog('BERTUI CLI', { color: 'blue' });
  console.log(`
Commands:
  bertui dev [--port]     Start development server (default: 3000)
  bertui build            Build for production
  bertui serve [--port]   Preview production build (default: 5000)
  bertui --version        Show version
  bertui --help           Show help

Options:
  --port, -p <number>     Port for server (dev: 3000, serve: 5000)

Examples:
  bertui dev
  bertui dev --port 8080
  bertui build
  bertui serve
  bertui serve --port 4000
  `);
}