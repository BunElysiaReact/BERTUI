here we will use the ernest logger libraray instead of chalk because i want colourfull logs and not just normal b/w logs the whole module is exported for use in the libraray 
it is a file that is complete and needs no updated later on 
// src/utils/logger.js
import { createLogger } from 'ernest-logger';

// Create logger instance for BertUI
const logger = createLogger({
  time: true,
  emoji: true,
  level: 'info',
  prefix: '[BertUI]',
  customLevels: {
    server: { color: 'brightCyan', emoji: '🌐', priority: 2 },
    build: { color: 'brightGreen', emoji: '📦', priority: 2 },
    hmr: { color: 'brightYellow', emoji: '🔥', priority: 2 }
  }
});

// Export the logger
export default logger;