// bertui/src/build/ssr-renderer.js
import { join } from 'path'
import { existsSync, mkdirSync, rmSync } from 'fs'
import logger from '../logger/logger.js'

/**
 * Render a static page to HTML string using renderToString.
 * Forces both the page and renderToString to use the same React
 * instance from the project's own node_modules.
 */
export async function renderPageToHTML(compiledPagePath, buildDir) {
  try {
    // Extract project root from compiled path
    // e.g. /project/.bertuibuild/pages/about.js → /project/
    const projectRoot = compiledPagePath.split('.bertuibuild')[0]

    // Explicitly resolve React from the PROJECT's node_modules
    // This prevents the two-React-instances problem when bertui is bun linked
    const reactPath         = join(projectRoot, 'node_modules', 'react', 'index.js')
    const reactDomServerPath = join(projectRoot, 'node_modules', 'react-dom', 'server.js')

    if (!existsSync(reactPath)) {
      logger.warn(`React not found in project node_modules: ${reactPath}`)
      return null
    }

    if (!existsSync(reactDomServerPath)) {
      logger.warn(`react-dom/server not found in project node_modules: ${reactDomServerPath}`)
      return null
    }

    const React            = await import(reactPath)
    const { renderToString } = await import(reactDomServerPath)

    // Import the compiled page
    const mod = await import(`${compiledPagePath}?t=${Date.now()}`)
    const Component = mod.default

    if (typeof Component !== 'function') {
      logger.warn(`No default export found in ${compiledPagePath}`)
      return null
    }

    return renderToString(React.createElement(Component))

  } catch (err) {
    logger.warn(`renderToString failed for ${compiledPagePath}: ${err.message}`)
    return null
  }
}

/**
 * Check if a route's source file has render = "server" or render = "static"
 */
export async function getPageRenderMode(sourcePath) {
  try {
    const src = await Bun.file(sourcePath).text()
    if (/export\s+const\s+render\s*=\s*["']server["']/.test(src)) return 'server'
    if (/export\s+const\s+render\s*=\s*["']static["']/.test(src)) return 'static'
    return 'default'
  } catch {
    return 'default'
  }
}