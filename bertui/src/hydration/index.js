// bertui/src/hydration/index.js
import logger from '../logger/logger.js';

const INTERACTIVE_MARKERS = [
  'useState', 'useEffect', 'useReducer', 'useCallback',
  'useMemo', 'useRef', 'useContext', 'useLayoutEffect',
  'useTransition', 'useDeferredValue', 'useSyncExternalStore',
  'onClick', 'onChange', 'onSubmit', 'onInput', 'onFocus',
  'onBlur', 'onMouseEnter', 'onMouseLeave', 'onKeyDown',
  'onKeyUp', 'onScroll', 'onDrop', 'onDrag', 'onTouchStart',
  'window.', 'document.', 'localStorage.', 'sessionStorage.',
  'navigator.', 'fetch(', 'WebSocket', 'EventSource',
  'setTimeout(', 'setInterval(', 'requestAnimationFrame(',
];

export function needsHydration(sourceCode) {
  for (const marker of INTERACTIVE_MARKERS) {
    if (sourceCode.includes(marker)) return true;
  }
  return false;
}

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

export async function analyzeRoutes(routes) {
  // dropped 'mixed' — it was never populated
  const result = { static: [], interactive: [] };

  for (const route of routes) {
    try {
      const sourceCode = await Bun.file(route.path).text();
      const isServerIsland = sourceCode.includes('export const render = "server"');
      const interactive = needsHydration(sourceCode);
      const features = getInteractiveFeatures(sourceCode);

      const renderMode = isServerIsland ? 'none' : interactive ? 'full' : 'none';

      const analyzed = {
        ...route,
        interactive,
        isServerIsland,
        features,
        hydrationMode: renderMode,
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
 * Given analyzed routes, generate the hydration script tag for a given route path.
 * Returns null if the route is static (no script needed).
 */
export function getHydrationScript(routePath, analyzedRoutes) {
  const isInteractive = analyzedRoutes.interactive.some(r => r.route === routePath);
  if (!isInteractive) return null;

  return `<script type="module" src="/_bertui/hydrate${routePath === '/' ? '/index' : routePath}.js"></script>`;
}

export function generatePartialHydrationCode(routes, analyzedRoutes) {
  const interactivePaths = new Set(analyzedRoutes.interactive.map(r => r.route));

  const imports = routes.map((route, i) => {
    const isInteractive = interactivePaths.has(route.route);
    const componentName = `Page${i}`;
    const importPath = `./pages/${route.file.replace(/\.(jsx|tsx|ts)$/, '.js')}`;

    // React.lazy import must be available in generated file
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

  // Note: consumer of this output must prepend: import React from 'react';
  return { imports, routeConfigs };
}

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