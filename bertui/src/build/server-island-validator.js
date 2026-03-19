// bertui/src/build/server-island-validator.js
import logger from '../logger/logger.js'

const BANNED_HOOKS = [
  'useState', 'useEffect', 'useReducer', 'useCallback', 'useMemo',
  'useRef', 'useContext', 'useLayoutEffect', 'useId',
  'useImperativeHandle', 'useDebugValue', 'useDeferredValue',
  'useTransition', 'useSyncExternalStore',
]

const BANNED_EVENTS = [
  'onClick', 'onChange', 'onSubmit', 'onInput', 'onFocus',
  'onBlur', 'onMouseEnter', 'onMouseLeave', 'onKeyDown', 'onKeyUp',
]

export function validateServerIsland(sourceCode, filePath) {
  const errors = []

  for (const hook of BANNED_HOOKS) {
    if (new RegExp(`\\b${hook}\\s*\\(`).test(sourceCode)) {
      errors.push(`Cannot use React hook "${hook}" in a static/server page — hooks need a browser runtime`)
    }
  }

  for (const event of BANNED_EVENTS) {
    if (sourceCode.includes(`${event}=`)) {
      errors.push(`Cannot use event handler "${event}" in a static/server page — events need a browser runtime`)
    }
  }

  if (/window\.|document\.|localStorage\.|sessionStorage\./.test(sourceCode)) {
    errors.push('Cannot access browser APIs (window/document/localStorage) in a static/server page')
  }

  return { valid: errors.length === 0, errors }
}

export function displayValidationErrors(filePath, errors) {
  logger.error(`\n❌ Static/Server page validation failed: ${filePath}`)
  for (const err of errors) {
    logger.error(`   · ${err}`)
  }
  logger.error(`   → Remove the above or switch to default render mode\n`)
}

export async function validateAllServerIslands(routes) {
  const serverIslands = []
  const validationResults = []

  for (const route of routes) {
    try {
      const src = await Bun.file(route.path).text()
      const isStatic = /export\s+const\s+render\s*=\s*["'](server|static)["']/.test(src)
      if (!isStatic) continue

      const result = validateServerIsland(src, route.path)
      serverIslands.push(route)
      validationResults.push({ ...result, route: route.route, path: route.path })

      if (!result.valid) {
        displayValidationErrors(route.path, result.errors)
      }
    } catch {}
  }

  return { serverIslands, validationResults }
}