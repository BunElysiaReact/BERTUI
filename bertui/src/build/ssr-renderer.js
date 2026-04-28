// bertui/src/build/ssr-renderer.js
import { join } from 'path'
import { existsSync } from 'fs'
import logger from '../logger/logger.js'
import { needsHydration } from '../hydration/index.js'

export async function renderPageToHTML(compiledPagePath, buildDir, sourcePath = null) {
  try {
    const projectRoot = compiledPagePath.split('.bertuibuild')[0]

    const reactPath          = join(projectRoot, 'node_modules', 'react', 'index.js')
    const reactDomServerPath = join(projectRoot, 'node_modules', 'react-dom', 'server.js')

    if (!existsSync(reactPath)) {
      logger.warn(`React not found in project node_modules: ${reactPath}`)
      return null
    }

    if (!existsSync(reactDomServerPath)) {
      logger.warn(`react-dom/server not found in project node_modules: ${reactDomServerPath}`)
      return null
    }

    const React = await import(reactPath)
    const { renderToString, renderToStaticMarkup } = await import(reactDomServerPath)

    const mod = await import(`${compiledPagePath}?t=${Date.now()}`)
    const Component = mod.default

    if (typeof Component !== 'function') {
      logger.warn(`No default export found in ${compiledPagePath}`)
      return null
    }

    // Use source file to check interactivity if provided
    let interactive = true
    if (sourcePath) {
      try {
        const src = await Bun.file(sourcePath).text()
        interactive = needsHydration(src)
      } catch {
        // fallback to renderToString if we can't read source
      }
    }

    // Static pages don't need hydration markers — use renderToStaticMarkup
    // Interactive pages use renderToString so hydrateRoot works on client
    const html = interactive
      ? renderToString(React.createElement(Component))
      : renderToStaticMarkup(React.createElement(Component))

    logger.debug(`   ${interactive ? 'renderToString' : 'renderToStaticMarkup'} → ${compiledPagePath}`)
    return { html, interactive }

  } catch (err) {
    logger.warn(`SSR render failed for ${compiledPagePath}: ${err.message}`)
    return null
  }
}

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