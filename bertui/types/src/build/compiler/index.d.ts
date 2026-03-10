/**
 * @param {string} root
 * @param {string} buildDir
 * @param {Object} envVars
 * @param {Object} config    - full bertui config (includes importhow)
 */
export function compileForBuild(root: string, buildDir: string, envVars: Object, config?: Object): Promise<{
    routes: any[];
    serverIslands: any[];
    clientRoutes: any[];
}>;
//# sourceMappingURL=index.d.ts.map