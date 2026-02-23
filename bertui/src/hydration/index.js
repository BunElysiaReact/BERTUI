// bertui/src/hydration/index.js
// Partial hydration - only hydrate interactive components, not whole page

import logger from '../logger/logger.js';

/**
 * Markers that make a component interactive (needs JS hydration)
 */
const INTERACTIVE_MARKERS = [
  // React hooks
  'useState', 'useEffect', 'useReducer', 'useCallback',
  'useMemo', 'useRef', 'useContext', 'useLayoutEffect',
  'useTransition', 'useDeferredValue', 'useSyncExternalStore',
  // Event handlers
  'onClick', 'onChange', 'onSubmit', 'onInput', 'onFocus',
  'onBlur', 'onMouseEnter', 'onMouseLeave', 'onKeyDown',
  'onKeyUp', 'onScroll', 'onDrop', 'onDrag', 'onTouchStart',
  // Browser APIs in component body
  'window.', 'document.', 'localStorage.', 'sessionStorage.',
  'navigator.', 'fetch(', 'WebSocket', 'EventSource',
  'setTimeout(', 'setInterval(', 'requestAnimationFrame(',
];

/**
 * Scan source code to determine if a component needs hydration
 */
export function needsHydration(sourceCode) {
  for (const marker of INTERACTIVE_MARKERS) {
    if (sourceCode.includes(marker)) {
      return true;
    }
  }
  return false;
}

/**
 * Get which specific interactive features a component uses
 */
export function getInteractiveFeatures(sourceCode) {
  const features = [];

  const hooks = ['useState', 'useEffect', 'useReducer', 'useCallback', 'useMemo', 'useRef'];
  for (const hook of hooks) {
    if (sourceCode.includes(hook)) features.push({ type: 'hook', name: hook });
  }

  const events = ['onClick', 'onChange', 'onSubmit', 'onFocus', 'onBlur', 'onKeyDown'];
  for (const event of events) {
    if (sourceCode.includes(event)) features.push({ type: 'event', name: event });
  }

  const apis = ['fetch(', 'WebSocket', 'localStorage.', 'sessionStorage.'];
  for (const api of apis) {
    if (sourceCode.includes(api)) features.push({ type: 'api', name: api });
  }

  return features;
}

/**
 * Analyze all routes and classify them
 * Returns: { static: [], interactive: [], mixed: [] }
 */
export async function analyzeRoutes(routes) {
  const result = { static: [], interactive: [], mixed: [] };

  for (const route of routes) {
    try {
      const sourceCode = await Bun.file(route.path).text();
      const isServerIsland = sourceCode.includes('export const render = "server"');
      const interactive = needsHydration(sourceCode);
      const features = getInteractiveFeatures(sourceCode);

      const analyzed = {
        ...route,
        interactive,
        isServerIsland,
        features,
        hydrationMode: isServerIsland
          ? 'none'
          : interactive
          ? 'full'
          : 'none',
      };

      if (isServerIsland || !interactive) {
        result.static.push(analyzed);
      } else {
        result.interactive.push(analyzed);
      }
    } catch (err) {
      logger.warn(`Could not analyze ${route.route}: ${err.message}`);
      result.interactive.push({ ...route, interactive: true, features: [] });
    }
  }

  return result;
}

/**
 * Generate hydration-aware router that skips JS for static routes
 * Key insight: static routes still render HTML, just skip React.hydrate()
 */
export function generatePartialHydrationCode(routes, analyzedRoutes) {
  const interactivePaths = new Set(
    analyzedRoutes.interactive.map(r => r.route)
  );

  const imports = routes.map((route, i) => {
    const isInteractive = interactivePaths.has(route.route);
    const componentName = `Page${i}`;
    const importPath = `./pages/${route.file.replace(/\.(jsx|tsx|ts)$/, '.js')}`;

    // Lazy load static routes (they're just HTML, load fast)
    // Eager load interactive routes (need JS ready)
    return isInteractive
      ? `import ${componentName} from '${importPath}';`
      : `const ${componentName} = React.lazy(() => import('${importPath}'));`;
  }).join('\n');

  const routeConfigs = routes.map((route, i) => {
    const isInteractive = interactivePaths.has(route.route);
    return `  { 
    path: '${route.route}', 
    component: Page${i}, 
    type: '${route.type}',
    hydrate: ${isInteractive},
    lazy: ${!isInteractive}
  }`;
  }).join(',\n');

  return { imports, routeConfigs };
}

/**
 * Log hydration analysis results
 */
export function logHydrationReport(analyzedRoutes) {
  const { static: staticRoutes, interactive } = analyzedRoutes;

  logger.bigLog('HYDRATION ANALYSIS', { color: 'cyan' });
  logger.info(`⚡ Interactive (needs JS): ${interactive.length} routes`);
  logger.info(`🏝️  Static (no JS needed): ${staticRoutes.length} routes`);

  if (interactive.length > 0) {
    logger.table(interactive.map(r => ({
      route: r.route,
      features: r.features.map(f => f.name).join(', ').substring(0, 40) || 'unknown',
    })));
  }
}