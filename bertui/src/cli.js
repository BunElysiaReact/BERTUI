// src/cli.js
import { startDev } from './dev.js';
import { buildProduction } from './build.js';
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
    
    case '--version':
    case '-v':
      console.log('bertui v0.1.0');
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
  bertui dev              Start development server
  bertui build            Build for production
  bertui --version        Show version
  bertui --help           Show help

Options:
  --port, -p <number>     Port for dev server (default: 3000)

Examples:
  bertui dev
  bertui dev --port 8080
  bertui build
  `);
}