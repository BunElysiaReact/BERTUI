// bertui/src/server/hmr-handler.js
// HMR WebSocket handler for development server

import logger from '../logger/logger.js';
import { compileFile } from '../client/compiler.js';

export class HMRHandler {
  constructor(root) {
    this.root = root;
    this.clients = new Set();
    this.compilationQueue = new Map();
    this.pendingUpdates = new Set();
    this.isProcessing = false;
  }

  // WebSocket connection handler
  onOpen(ws) {
    this.clients.add(ws);
    logger.debug(`HMR client connected (${this.clients.size} total)`);
    
    // Send initial state
    ws.send(JSON.stringify({
      type: 'hmr-connected',
      timestamp: Date.now()
    }));
  }

  onClose(ws) {
    this.clients.delete(ws);
    logger.debug(`HMR client disconnected (${this.clients.size} remaining)`);
  }

  onMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'hmr-accept':
          this.handleAccept(data.module);
          break;
        case 'hmr-decline':
          this.handleDecline(data.module);
          break;
      }
    } catch (err) {
      logger.error(`HMR message error: ${err.message}`);
    }
  }

  // Notify all clients
  notifyAll(message) {
    const payload = JSON.stringify(message);
    
    for (const client of this.clients) {
      try {
        client.send(payload);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  // Queue file for recompilation
  queueRecompile(filename) {
    this.pendingUpdates.add(filename);
    
    if (!this.isProcessing) {
      setTimeout(() => this.processQueue(), 50);
    }
  }

  // Process compilation queue
  async processQueue() {
    if (this.isProcessing || this.pendingUpdates.size === 0) return;
    
    this.isProcessing = true;
    const files = Array.from(this.pendingUpdates);
    this.pendingUpdates.clear();
    
    try {
      const start = Date.now();
      const results = [];
      
      for (const file of files) {
        try {
          const result = await compileFile(file, this.root);
          results.push(result);
        } catch (err) {
          logger.error(`HMR compile error: ${file} - ${err.message}`);
          
          // Send error overlay
          this.notifyAll({
            type: 'compilation-error',
            file,
            message: err.message,
            stack: err.stack
          });
        }
      }
      
      const duration = Date.now() - start;
      
      // Notify clients of updates
      for (const result of results) {
        if (result && result.outputPath) {
          this.notifyAll({
            type: 'hmr-update',
            module: `/compiled/${result.outputPath}`,
            time: duration / results.length,
            dependencies: result.dependencies || []
          });
        }
      }
      
      logger.success(`✅ HMR updated ${results.length} files in ${duration}ms`);
      
    } catch (err) {
      logger.error(`HMR queue error: ${err.message}`);
      this.notifyAll({ type: 'full-reload' });
    } finally {
      this.isProcessing = false;
    }
  }

  // Handle HMR accept
  handleAccept(moduleId) {
    // Track accepted modules if needed
  }

  // Handle HMR decline
  handleDecline(moduleId) {
    // Force full reload for declined modules
    this.notifyAll({ type: 'full-reload' });
  }

  // Force full reload
  reload() {
    this.notifyAll({ type: 'full-reload' });
  }

  // Dispose handler
  dispose() {
    this.notifyAll({ type: 'hmr-shutdown' });
    this.clients.clear();
    this.pendingUpdates.clear();
    this.compilationQueue.clear();
  }
}