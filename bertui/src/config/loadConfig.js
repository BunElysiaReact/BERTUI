// bertui/src/config/loadConfig.js
import { join } from 'path';
import { existsSync } from 'fs';
import { defaultConfig } from './defaultConfig.js';
import logger from '../logger/logger.js';

export async function loadConfig(root) {
  const configPath = join(root, 'bertui.config.js');

  if (!existsSync(configPath)) {
    logger.info('No config found, using defaults');
    return defaultConfig;
  }

  try {
    // Read and transpile the config file manually —
    // avoids Bun's dynamic import() build step which errors on plain JS configs
    const source = await Bun.file(configPath).text();

    const transpiler = new Bun.Transpiler({
      loader: 'js',
      target: 'bun',
    });

    let code = await transpiler.transform(source);

    // Strip any leftover 'export default' so we can eval it
    // and grab the value directly
    code = code.replace(/export\s+default\s+/, 'globalThis.__bertuiConfig = ');

    // Run it in the current context
    const fn = new Function('globalThis', code);
    fn(globalThis);

    const userConfig = globalThis.__bertuiConfig;
    delete globalThis.__bertuiConfig;

    if (!userConfig) {
      logger.warn('bertui.config.js did not export a default value, using defaults');
      return defaultConfig;
    }

    logger.success('Loaded bertui.config.js');

    logger.info(`📋 Config: importhow=${JSON.stringify(Object.keys(userConfig.importhow || {}))}`);

    return mergeConfig(defaultConfig, userConfig);

  } catch (error) {
    logger.error(`Failed to load bertui.config.js: ${error.message}`);
    return defaultConfig;
  }
}

function mergeConfig(defaults, user) {
  const merged = { ...user };
  merged.meta      = { ...defaults.meta,      ...(user.meta      || {}) };
  merged.appShell  = { ...defaults.appShell,  ...(user.appShell  || {}) };
  merged.robots    = { ...defaults.robots,    ...(user.robots    || {}) };
  merged.importhow = { ...(defaults.importhow || {}), ...(user.importhow || {}) };
  if (!merged.siteName) merged.siteName = defaults.siteName;
  if (!merged.baseUrl)  merged.baseUrl  = defaults.baseUrl;
  return merged;
}