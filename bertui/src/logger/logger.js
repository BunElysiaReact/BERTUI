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