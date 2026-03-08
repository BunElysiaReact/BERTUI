// bertui/src/utils/importhow.js
import { join, relative, dirname } from 'path';

/**
 * @param {Object} importhow   - { alias: relPath } from bertui.config.js
 * @param {string} projectRoot - absolute project root
 * @param {string} compiledDir - if set, aliases resolve to compiledDir/<alias>
 *                               pass .bertui/compiled in dev mode
 *                               leave null in build mode (uses raw source paths)
 */
export function buildAliasMap(importhow = {}, projectRoot, compiledDir = null) {
  const map = new Map();
  for (const [alias, relPath] of Object.entries(importhow)) {
    const abs = compiledDir
      ? join(compiledDir, alias)      // dev:   .bertui/compiled/amani
      : join(projectRoot, relPath);   // build: /project/src/components
    map.set(alias, abs);
  }
  return map;
}

/**
 * Rewrite alias import specifiers in compiled code.
 * 'amani/button' → '../components/button.js'
 */
export function rewriteAliasImports(code, currentFile, aliasMap) {
  if (!aliasMap || aliasMap.size === 0) return code;

  const currentDir = dirname(currentFile);
  const importRe = /(?:import|export)(?:\s+[\w*{},\s]+\s+from)?\s+['"]([^'"]+)['"]/g;

  return code.replace(importRe, (match, specifier) => {
    const slashIdx = specifier.indexOf('/');
    const alias    = slashIdx === -1 ? specifier : specifier.slice(0, slashIdx);
    const rest     = slashIdx === -1 ? ''        : specifier.slice(slashIdx);

    const absBase = aliasMap.get(alias);
    if (!absBase) return match;

    let rel = relative(currentDir, absBase + rest).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = './' + rel;
    if (rest && !/\.\w+$/.test(rest)) rel += '.js';

    return match.replace(`'${specifier}'`, `'${rel}'`).replace(`"${specifier}"`, `"${rel}"`);
  });
}

export function getAliasDirs(aliasMap) {
  const dirs = new Set();
  for (const absPath of aliasMap.values()) dirs.add(absPath);
  return dirs;
}