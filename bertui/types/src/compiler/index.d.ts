export function transformJSX(sourceCode: any, options?: {}): Promise<any>;
export { compileProject } from "../client/compiler.js";
export { compileForBuild } from "../build/compiler/index.js";
export { discoverRoutes } from "../build/compiler/route-discoverer.js";
export { validateServerIsland } from "../build/server-island-validator.js";
export { generateRouterCode } from "./router-generator-pure.js";
export { transformJSX, transformJSXSync, containsJSX, removeCSSImports, removeDotenvImports, fixRelativeImports } from "./transform.js";
//# sourceMappingURL=index.d.ts.map