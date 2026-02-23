// bertui/src/layouts/index.js
// Layout system - src/layouts/default.tsx wraps all pages

import { join, extname, basename } from 'path';
import { existsSync, readdirSync, mkdirSync } from 'fs';;
import logger from '../logger/logger.js';

/**
 * Discover all layouts in src/layouts/
 * Layout naming convention:
 *   default.tsx  → wraps all pages (fallback)
 *   blog.tsx     → wraps pages in /blog/*
 *   [route].tsx  → wraps pages matching route prefix
 */
export async function discoverLayouts(root) {
  const layoutsDir = join(root, 'src', 'layouts');
  const layouts = {};

  if (!existsSync(layoutsDir)) {
    return layouts;
  }

  const entries = readdirSync(layoutsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = extname(entry.name);
    if (!['.jsx', '.tsx', '.js', '.ts'].includes(ext)) continue;

    const name = basename(entry.name, ext);
    layouts[name] = {
      name,
      path: join(layoutsDir, entry.name),
      route: name === 'default' ? '*' : `/${name}`,
    };

    logger.debug(`📐 Layout found: ${entry.name} → ${layouts[name].route}`);
  }

  if (Object.keys(layouts).length > 0) {
    logger.success(`✅ ${Object.keys(layouts).length} layout(s) loaded`);
  }

  return layouts;
}

/**
 * Match which layout applies to a given route
 * Priority: exact name match > default
 */
export function matchLayout(route, layouts) {
  if (!layouts || Object.keys(layouts).length === 0) return null;

  // Strip leading slash and get first segment
  const segment = route.replace(/^\//, '').split('/')[0];

  // Exact match (e.g., /blog → blog.tsx)
  if (segment && layouts[segment]) {
    return layouts[segment];
  }

  // Default layout fallback
  if (layouts['default']) {
    return layouts['default'];
  }

  return null;
}

/**
 * Generate layout wrapper code for the compiler
 * Wraps the page component with the layout component
 */
export function generateLayoutWrapper(pageImportPath, layoutImportPath, componentName = 'Page') {
  return `
import React from 'react';
import ${componentName} from '${pageImportPath}';
import Layout from '${layoutImportPath}';

export default function LayoutWrapped(props) {
  return React.createElement(
    Layout,
    props,
    React.createElement(${componentName}, props)
  );
}
`.trim();
}

/**
 * Compile layouts directory - transpiles layout files to .bertui/compiled/layouts/
 */
export async function compileLayouts(root, compiledDir) {
  const layoutsDir = join(root, 'src', 'layouts');
  if (!existsSync(layoutsDir)) return {};

  const outDir = join(compiledDir, 'layouts');
  
  mkdirSync(outDir, { recursive: true });

  const layouts = await discoverLayouts(root);

  for (const [name, layout] of Object.entries(layouts)) {
    const ext = extname(layout.path);
    const loader = ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx';

    try {
      let code = await Bun.file(layout.path).text();

      // Add React import if missing
      if (!code.includes('import React')) {
        code = `import React from 'react';\n${code}`;
      }

      const transpiler = new Bun.Transpiler({
        loader,
        target: 'browser',
        tsconfig: {
          compilerOptions: {
            jsx: 'react',
            jsxFactory: 'React.createElement',
            jsxFragmentFactory: 'React.Fragment',
          },
        },
      });

      let compiled = await transpiler.transform(code);

      // Fix relative imports
      compiled = compiled.replace(
        /from\s+['"](\.\.?\/[^'"]+?)(?<!\.js|\.jsx|\.ts|\.tsx|\.json)['"]/g,
        (match, path) => {
          if (path.endsWith('/') || /\.\w+$/.test(path)) return match;
          return `from '${path}.js'`;
        }
      );

      await Bun.write(join(outDir, `${name}.js`), compiled);
      logger.debug(`📐 Compiled layout: ${name}`);
    } catch (err) {
      logger.error(`Failed to compile layout ${name}: ${err.message}`);
    }
  }

  return layouts;
}

/**
 * Inject layout into router generation
 * Called by router-generator to wrap page components with their layouts
 */
export function injectLayoutsIntoRouter(routes, layouts, compiledDir) {
  if (!layouts || Object.keys(layouts).length === 0) return routes;

  return routes.map(route => {
    const layout = matchLayout(route.route, layouts);
    if (!layout) return route;

    return {
      ...route,
      layout: layout.name,
      layoutPath: join(compiledDir, 'layouts', `${layout.name}.js`),
    };
  });
}