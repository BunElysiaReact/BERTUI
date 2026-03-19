// bertui/src/build/generators/html-generator.js
import { join, relative } from 'path'
import { mkdirSync, existsSync, cpSync } from 'fs'
import logger from '../../logger/logger.js'
import { extractMetaFromSource } from '../../utils/meta-extractor.js'
import { renderPageToHTML, getPageRenderMode } from '../ssr-renderer.js'

export async function generateProductionHTML(root, outDir, buildResult, routes, config, buildDir) {
  const mainBundle = buildResult.outputs.find(o =>
    o.path.includes('main') && o.kind === 'entry-point'
  )

  if (!mainBundle) {
    logger.error('Could not find main bundle')
    return
  }

  const bundlePath = relative(outDir, mainBundle.path).replace(/\\/g, '/')
  const defaultMeta = config.meta || {}
  const bertuiPackages = await copyBertuiPackagesToProduction(root, outDir)


  logger.info(`Generating HTML for ${routes.length} routes...`)

  for (const route of routes) {
    await processSingleRoute(route, config, defaultMeta, bundlePath, outDir, bertuiPackages, buildDir)
  }

  logger.success(`HTML generation complete for ${routes.length} routes`)
}

async function processSingleRoute(route, config, defaultMeta, bundlePath, outDir, bertuiPackages, buildDir) {
  try {
    const sourceCode = await Bun.file(route.path).text()
    const pageMeta = extractMetaFromSource(sourceCode)
    const meta = { ...defaultMeta, ...pageMeta }

    // Determine render mode from source
    const renderMode = await getPageRenderMode(route.path)

    let html

    if (renderMode === 'server' || renderMode === 'static') {
      // Find the compiled version of this page in buildDir
      const compiledPath = findCompiledPath(route, buildDir)

      if (compiledPath && existsSync(compiledPath)) {
        logger.info(`  SSR rendering: ${route.route}`)
        const ssrHTML = await renderPageToHTML(compiledPath, buildDir)

        if (ssrHTML) {
          if (renderMode === 'static') {
            // Pure static — no JS at all
            html = generateStaticHTML({ ssrHTML, meta, bertuiPackages })
          } else {
            // Server island — SSR HTML + JS bundle for hydration
            html = generateServerIslandHTML({ ssrHTML, meta, bundlePath, bertuiPackages })
          }
          logger.success(`  ✓ SSR: ${route.route} (${renderMode})`)
        } else {
          // SSR failed — fall back to client render with a warning
          logger.warn(`  SSR failed for ${route.route}, falling back to client render`)
          html = generateClientHTML({ meta, bundlePath, bertuiPackages })
        }
      } else {
        logger.warn(`  Compiled path not found for ${route.route}, using client render`)
        html = generateClientHTML({ meta, bundlePath, bertuiPackages })
      }
    } else {
      // Default: client-only SPA
      html = generateClientHTML({ meta, bundlePath, bertuiPackages })
    }

    // Write to dist/
    let htmlPath
    if (route.route === '/') {
      htmlPath = join(outDir, 'index.html')
    } else {
      const routeDir = join(outDir, route.route.replace(/^\//, ''))
      mkdirSync(routeDir, { recursive: true })
      htmlPath = join(routeDir, 'index.html')
    }

    await Bun.write(htmlPath, html)
    logger.success(`  ${route.route}`)

  } catch (error) {
    logger.error(`Failed HTML for ${route.route}: ${error.message}`)
  }
}

/**
 * Find the compiled .js path for a route's source file
 */
function findCompiledPath(route, buildDir) {
  const compiledFile = route.file.replace(/\.(jsx|tsx|ts)$/, '.js')
  return join(buildDir, 'pages', compiledFile)
}
// ─── HTML generators ──────────────────────────────────────────────────────────

/**
 * render = "static" → pure HTML, zero JS
 */
function generateStaticHTML({ ssrHTML, meta, bertuiPackages }) {
  const bertuiAnimateCSS = bertuiPackages.bertuiAnimate
    ? '<link rel="stylesheet" href="/css/bertui-animate.min.css">'
    : ''

  return `<!DOCTYPE html>
<html lang="${meta.lang || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title || 'BertUI App'}</title>
  <meta name="description" content="${meta.description || ''}">
  ${meta.keywords     ? `<meta name="keywords" content="${meta.keywords}">` : ''}
  ${meta.author       ? `<meta name="author" content="${meta.author}">` : ''}
  ${meta.themeColor   ? `<meta name="theme-color" content="${meta.themeColor}">` : ''}
  <meta property="og:title" content="${meta.ogTitle || meta.title || 'BertUI App'}">
  <meta property="og:description" content="${meta.ogDescription || meta.description || ''}">
  ${meta.ogImage ? `<meta property="og:image" content="${meta.ogImage}">` : ''}
  <link rel="stylesheet" href="/styles/bertui.min.css">
  ${bertuiAnimateCSS}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
</head>
<body>
  ${ssrHTML}
</body>
</html>`
}

/**
 * render = "server" → SSR HTML + JS bundle for hydration
 */
function generateServerIslandHTML({ ssrHTML, meta, bundlePath, bertuiPackages }) {
  const { importMapScript, bertuiAnimateCSS } = buildSharedAssets(meta, bertuiPackages)

  return `<!DOCTYPE html>
<html lang="${meta.lang || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title || 'BertUI App'}</title>
  <meta name="description" content="${meta.description || ''}">
  ${meta.keywords     ? `<meta name="keywords" content="${meta.keywords}">` : ''}
  ${meta.author       ? `<meta name="author" content="${meta.author}">` : ''}
  ${meta.themeColor   ? `<meta name="theme-color" content="${meta.themeColor}">` : ''}
  <meta property="og:title" content="${meta.ogTitle || meta.title || 'BertUI App'}">
  <meta property="og:description" content="${meta.ogDescription || meta.description || ''}">
  ${meta.ogImage ? `<meta property="og:image" content="${meta.ogImage}">` : ''}
  <link rel="stylesheet" href="/styles/bertui.min.css">
  ${bertuiAnimateCSS}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  ${importMapScript}
</head>
<body>
  <div id="root">${ssrHTML}</div>
  <script type="module" src="/${bundlePath}"></script>
</body>
</html>`
}

/**
 * default → client-only SPA (existing behavior)
 */
function generateClientHTML({ meta, bundlePath, bertuiPackages }) {
  const { importMapScript, bertuiAnimateCSS } = buildSharedAssets(meta, bertuiPackages)

  return `<!DOCTYPE html>
<html lang="${meta.lang || 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title || 'BertUI App'}</title>
  <meta name="description" content="${meta.description || ''}">
  ${meta.keywords     ? `<meta name="keywords" content="${meta.keywords}">` : ''}
  ${meta.author       ? `<meta name="author" content="${meta.author}">` : ''}
  ${meta.themeColor   ? `<meta name="theme-color" content="${meta.themeColor}">` : ''}
  <meta property="og:title" content="${meta.ogTitle || meta.title || 'BertUI App'}">
  <meta property="og:description" content="${meta.ogDescription || meta.description || ''}">
  ${meta.ogImage ? `<meta property="og:image" content="${meta.ogImage}">` : ''}
  <link rel="stylesheet" href="/styles/bertui.min.css">
  ${bertuiAnimateCSS}
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  ${importMapScript}
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/${bundlePath}"></script>
</body>
</html>`
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function buildSharedAssets(meta, bertuiPackages) {
  const bertuiIconsImport = bertuiPackages.bertuiIcons
    ? ',\n      "bertui-icons": "/node_modules/bertui-icons/generated/index.js"'
    : ''
  const elysiaEdenImport = bertuiPackages.elysiaEden
    ? ',\n      "@elysiajs/eden": "/node_modules/@elysiajs/eden/dist/index.mjs"'
    : ''
  const bertuiAnimateCSS = bertuiPackages.bertuiAnimate
    ? '<link rel="stylesheet" href="/css/bertui-animate.min.css">'
    : ''

  const importMapScript = `<script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.2.0",
      "react-dom": "https://esm.sh/react-dom@18.2.0",
      "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
      "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime",
      "react/jsx-dev-runtime": "https://esm.sh/react@18.2.0/jsx-dev-runtime",
      "@bunnyx/api": "/bunnyx-api/api-client.js"${bertuiIconsImport}${elysiaEdenImport}
    }
  }
  </script>`

  return { importMapScript, bertuiAnimateCSS }
}

async function copyBertuiPackagesToProduction(root, outDir) {
  const nodeModulesDir = join(root, 'node_modules')
  const packages = { bertuiIcons: false, bertuiAnimate: false, elysiaEden: false }

  if (!existsSync(nodeModulesDir)) return packages

  const bertuiIconsSrc = join(nodeModulesDir, 'bertui-icons')
  if (existsSync(bertuiIconsSrc)) {
    try {
      const dest = join(outDir, 'node_modules', 'bertui-icons')
      mkdirSync(join(outDir, 'node_modules'), { recursive: true })
      cpSync(bertuiIconsSrc, dest, { recursive: true })
      packages.bertuiIcons = true
    } catch {}
  }

  const bertuiAnimateSrc = join(nodeModulesDir, 'bertui-animate', 'dist')
  if (existsSync(bertuiAnimateSrc)) {
    try {
      const dest = join(outDir, 'css')
      mkdirSync(dest, { recursive: true })
      const minCSS = join(bertuiAnimateSrc, 'bertui-animate.min.css')
      if (existsSync(minCSS)) {
        cpSync(minCSS, join(dest, 'bertui-animate.min.css'))
        packages.bertuiAnimate = true
      }
    } catch {}
  }

  const elysiaEdenSrc = join(nodeModulesDir, '@elysiajs', 'eden')
  if (existsSync(elysiaEdenSrc)) {
    try {
      const dest = join(outDir, 'node_modules', '@elysiajs', 'eden')
      mkdirSync(join(outDir, 'node_modules', '@elysiajs'), { recursive: true })
      cpSync(elysiaEdenSrc, dest, { recursive: true })
      packages.elysiaEden = true
    } catch {}
  }

  return packages
}