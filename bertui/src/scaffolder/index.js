// bertui/src/scaffolder/index.js
// CLI component/page/layout scaffolder

import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import logger from '../logger/logger.js';
// ─── TEMPLATES ─────────────────────────────────────────────────────────────

const TEMPLATES = {
  component: (name) => `import React, { useState } from 'react';

interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
}

export default function ${name}({ className = '', children }: ${name}Props) {
  return (
    <div className={className}>
      {children ?? <p>${name} component</p>}
    </div>
  );
}
`,

  page: (name, route) => `// Route: ${route}
import React from 'react';
import { Link } from 'bertui/router';

export const title = '${name}';
export const description = '${name} page';

export default function ${name}Page() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>${name}</h1>
      <p>Welcome to ${name}</p>
      <Link to="/">← Back home</Link>
    </main>
  );
}
`,

  layout: (name) => `import React from 'react';

interface ${name}LayoutProps {
  children: React.ReactNode;
}

// This layout wraps all pages${name === 'default' ? '' : ` under /${name.toLowerCase()}/`}
export default function ${name}Layout({ children }: ${name}LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui' }}>
      <header style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <a href="/" style={{ fontWeight: 700, textDecoration: 'none', color: 'inherit' }}>
          My App
        </a>
        <nav style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="/" style={{ color: '#4b5563', textDecoration: 'none' }}>Home</a>
          <a href="/about" style={{ color: '#4b5563', textDecoration: 'none' }}>About</a>
        </nav>
      </header>
      <main style={{ padding: '2rem' }}>
        {children}
      </main>
      <footer style={{
        padding: '1rem 2rem',
        borderTop: '1px solid #e5e7eb',
        color: '#9ca3af',
        fontSize: '14px',
        textAlign: 'center',
      }}>
        Built with BertUI ⚡
      </footer>
    </div>
  );
}
`,

  loading: (name) => `import React from 'react';

// Loading state for ${name} route
// This shows while the page JavaScript loads
export default function ${name}Loading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
      fontFamily: 'system-ui',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e5e7eb',
        borderTopColor: '#10b981',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading ${name}...</p>
    </div>
  );
}
`,

  middleware: () => `import type { MiddlewareContext } from 'bertui/middleware';

// Runs before EVERY page request
// Use ctx.redirect(), ctx.respond(), or ctx.locals to pass data

export async function onRequest(ctx: MiddlewareContext) {
  // Example: protect /dashboard
  // if (ctx.pathname.startsWith('/dashboard')) {
  //   const token = ctx.headers['authorization'];
  //   if (!token) return ctx.redirect('/login');
  // }

  // Example: add custom headers
  // ctx.setHeader('X-Powered-By', 'BertUI');

  // Example: pass data to pages via locals
  // ctx.locals.user = await getUser(ctx.headers.cookie);

  console.log('[Middleware]', ctx.method, ctx.pathname);
}

// Optional: handle middleware errors
export async function onError(ctx: MiddlewareContext, error: Error) {
  console.error('[Middleware Error]', error.message);
}
`,
};

// ─── SCAFFOLDER ─────────────────────────────────────────────────────────────

export async function scaffold(type, name, options = {}) {
  const root = options.root || process.cwd();
  const ts = options.ts !== false; // Default: TypeScript

  const ext = ts ? '.tsx' : '.jsx';

  switch (type) {
    case 'component':
      return createComponent(name, root, ext);
    case 'page':
      return createPage(name, root, ext);
    case 'layout':
      return createLayout(name, root, ext);
    case 'loading':
      return createLoading(name, root, ext);
    case 'middleware':
      return createMiddleware(root, ts);
    default:
      logger.error(`Unknown scaffold type: ${type}`);
      logger.info('Available types: component, page, layout, loading, middleware');
      return false;
  }
}

async function createComponent(name, root, ext) {
  const pascal = toPascalCase(name);
  const dir = join(root, 'src', 'components');

  fsMkdir(dir, { recursive: true });

  const filePath = join(dir, `${pascal}${ext}`);

  if (fsExists(filePath)) {
    logger.warn(`Component already exists: src/components/${pascal}${ext}`);
    return false;
  }

  await Bun.write(filePath, TEMPLATES.component(pascal));
  logger.success(`✅ Created component: src/components/${pascal}${ext}`);
  return filePath;
}

async function createPage(name, root, ext) {
  const pascal = toPascalCase(name);
  const route = `/${name.toLowerCase().replace(/\s+/g, '-')}`;

  // Handle nested routes like "blog/[slug]"
  const parts = name.split('/');
  const pageName = toPascalCase(parts[parts.length - 1]);
  const dir = join(root, 'src', 'pages', ...parts.slice(0, -1));

  fsMkdir(dir, { recursive: true });

  // Handle index pages
  const fileName = pageName.toLowerCase() === 'index' ? 'index' : pageName.toLowerCase();
  const filePath = join(dir, `${fileName}${ext}`);

  if (fsExists(filePath)) {
    logger.warn(`Page already exists: src/pages/${name}${ext}`);
    return false;
  }

  await Bun.write(filePath, TEMPLATES.page(pascal, route));
  logger.success(`✅ Created page: src/pages/${name}${ext}`);
  logger.info(`   Route: ${route}`);
  return filePath;
}

async function createLayout(name, root, ext) {
  const pascal = toPascalCase(name);
  const dir = join(root, 'src', 'layouts');

  fsMkdir(dir, { recursive: true });

  const filePath = join(dir, `${name.toLowerCase()}${ext}`);

  if (fsExists(filePath)) {
    logger.warn(`Layout already exists: src/layouts/${name.toLowerCase()}${ext}`);
    return false;
  }

  await Bun.write(filePath, TEMPLATES.layout(pascal));
  logger.success(`✅ Created layout: src/layouts/${name.toLowerCase()}${ext}`);

  if (name.toLowerCase() === 'default') {
    logger.info('   → This layout will wrap ALL pages automatically');
  } else {
    logger.info(`   → This layout will wrap pages under /${name.toLowerCase()}/`);
  }

  return filePath;
}

async function createLoading(name, root, ext) {
  const pascal = toPascalCase(name);

  // Place loading.tsx next to the relevant page/route
  const isRoot = name.toLowerCase() === 'root' || name === '/';
  const dir = isRoot
    ? join(root, 'src', 'pages')
    : join(root, 'src', 'pages', name.toLowerCase());

  fsMkdir(dir, { recursive: true });

  const filePath = join(dir, `loading${ext}`);

  if (fsExists(filePath)) {
    logger.warn(`Loading component already exists at ${dir}/loading${ext}`);
    return false;
  }

  await Bun.write(filePath, TEMPLATES.loading(pascal));
  logger.success(`✅ Created loading state: ${filePath.replace(root, '')}`);
  logger.info(`   → Shows while ${isRoot ? 'root' : `/${name.toLowerCase()}`} route loads`);
  return filePath;
}

async function createMiddleware(root, ts) {
  const ext = ts ? '.ts' : '.js';
  const filePath = join(root, 'src', `middleware${ext}`);

  if (fsExists(filePath)) {
    logger.warn(`Middleware already exists: src/middleware${ext}`);
    return false;
  }

  await Bun.write(filePath, TEMPLATES.middleware());
  logger.success(`✅ Created middleware: src/middleware${ext}`);
  logger.info('   → Runs before every page request');
  return filePath;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function toPascalCase(str) {
  return str
    .replace(/[-_\s]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, c => c.toUpperCase())
    .replace(/[[\]]/g, ''); // Remove bracket from dynamic routes
}

/**
 * Parse CLI args for the create command
 * Usage: bertui create component Button
 *        bertui create page About
 *        bertui create layout default
 *        bertui create loading blog
 *        bertui create middleware
 */
export function parseCreateArgs(args) {
  const [type, name] = args;

  if (!type) {
    logger.error('Usage: bertui create <type> [name]');
    logger.info('Types: component, page, layout, loading, middleware');
    return null;
  }

  if (type !== 'middleware' && !name) {
    logger.error(`Usage: bertui create ${type} <name>`);
    return null;
  }

  return { type, name: name || type };
}