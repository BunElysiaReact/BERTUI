/**
 * @param {Object} importhow   - { alias: relPath } from bertui.config.js
 * @param {string} projectRoot - absolute project root
 * @param {string} compiledDir - if set, aliases resolve to compiledDir/<alias>
 *                               pass .bertui/compiled in dev mode
 *                               leave null in build mode (uses raw source paths)
 */
export function buildAliasMap(importhow: Object | undefined, projectRoot: string, compiledDir?: string): Map<any, any>;
/**
 * Rewrite alias import specifiers in compiled code.
 * 'amani/button' → '../components/button.js'
 */
export function rewriteAliasImports(code: any, currentFile: any, aliasMap: any): any;
export function getAliasDirs(aliasMap: any): Set<any>;
//# sourceMappingURL=importhow.d.ts.map