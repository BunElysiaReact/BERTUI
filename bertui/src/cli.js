// bertui/src/cli.js - WITH ALL COMMANDS
import { startDev } from './dev.js';
import { buildProduction } from './build.js';
import { startPreviewServer } from './serve.js';
import { scaffold, parseCreateArgs } from './scaffolder/index.js';
import { analyzeBuild } from './analyzer/index.js';
import logger from './logger/logger.js';
import { join } from 'path';

export function program() {
  const args = process.argv.slice(2);
  const command = args[0] || 'dev';

  switch (command) {
    case 'dev': {
      const devPort = getArg('--port', '-p') || 3000;
      startDev({
        port: parseInt(devPort),
        root: process.cwd(),
      });
      break;
    }

    case 'build': {
      buildProduction({ root: process.cwd() });
      break;
    }

    case 'serve':
    case 'preview': {
      const previewPort = getArg('--port', '-p') || 5000;
      startPreviewServer({
        port: parseInt(previewPort),
        root: process.cwd(),
        dir: 'dist',
      });
      break;
    }

    // ✅ NEW: Component/page/layout scaffolder
    case 'create': {
      const createArgs = args.slice(1);
      const parsed = parseCreateArgs(createArgs);
      if (parsed) {
        scaffold(parsed.type, parsed.name, { root: process.cwd() })
          .then(result => {
            if (!result) process.exit(1);
          })
          .catch(err => {
            logger.error(`Create failed: ${err.message}`);
            process.exit(1);
          });
      }
      break;
    }

    // ✅ NEW: Bundle analyzer
    case 'analyze': {
      const outDir = join(process.cwd(), 'dist');
      const open = args.includes('--open');
      analyzeBuild(outDir, { open })
        .then(result => {
          if (!result) {
            logger.error('No build found. Run: bertui build');
            process.exit(1);
          }
        })
        .catch(err => {
          logger.error(`Analyze failed: ${err.message}`);
          process.exit(1);
        });
      break;
    }

    case '--version':
    case '-v':
      console.log('bertui v1.2.0');
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
  bertui dev [--port]              Start development server (default: 3000)
  bertui build                     Build for production
  bertui serve [--port]            Preview production build (default: 5000)
  bertui analyze [--open]          Analyze bundle size (opens report in browser)

  bertui create component <Name>   Scaffold a React component
  bertui create page <name>        Scaffold a page (adds to file-based routing)
  bertui create layout <name>      Scaffold a layout (default wraps all pages)
  bertui create loading <route>    Scaffold a per-route loading state
  bertui create middleware         Scaffold src/middleware.ts

Options:
  --port, -p <number>              Port for server
  --open                           Open browser after command

Examples:
  bertui dev
  bertui dev --port 8080
  bertui build
  bertui analyze --open
  bertui create component Button
  bertui create page About
  bertui create page blog/[slug]
  bertui create layout default
  bertui create layout blog
  bertui create loading blog
  bertui create middleware
  `);
}