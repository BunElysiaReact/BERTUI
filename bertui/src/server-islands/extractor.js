// bertui/src/server-islands/extractor.js - PURE SERVER ISLAND EXTRACTOR

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import logger from '../logger/logger.js';

/**
 * Extract static HTML from a Server Island component
 * @param {string} filePath - Path to the component file
 * @returns {Promise<string|null>} Extracted HTML or null if extraction fails
 */
export async function extractStaticHTML(filePath = 'unknown') {
  try {
    // Dynamically import the component module
    const mod = await import(filePath);
    const Component = mod.default;

    if (!Component) {
      logger.error(`❌ No default export found in ${filePath}`);
      return null;
    }

    // Validate it's actually a server island
    if (!isServerIsland(mod)) {
      logger.warn(`⚠️  ${filePath} is not marked as a server island`);
      return null;
    }

    // Let React do all the heavy lifting
    const html = renderToStaticMarkup(createElement(Component));

    logger.debug(`   Extracted ${html.length} chars of static HTML from ${filePath}`);
    return html;

  } catch (error) {
    logger.error(`Failed to extract HTML from ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Quick check if a module is a Server Island
 * Checks the exported render flag from the module itself
 */
export function isServerIsland(modOrSource) {
  // Accept either the imported module object or raw source string
  if (typeof modOrSource === 'string') {
    return modOrSource.includes('export const render = "server"');
  }
  return modOrSource?.render === 'server';
}

/**
 * Extract component name from file path
 */
export function extractComponentName(filePath) {
  const fileName = filePath.split(/[\/\\]/).pop() || '';
  return fileName.replace(/\.[^/.]+$/, '');
}