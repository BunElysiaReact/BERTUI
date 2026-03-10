/**
 * Discover all layouts in src/layouts/
 * Layout naming convention:
 *   default.tsx  → wraps all pages (fallback)
 *   blog.tsx     → wraps pages in /blog/*
 *   [route].tsx  → wraps pages matching route prefix
 */
export function discoverLayouts(root: any): Promise<{}>;
/**
 * Match which layout applies to a given route
 * Priority: exact name match > default
 */
export function matchLayout(route: any, layouts: any): any;
/**
 * Generate layout wrapper code for the compiler
 * Wraps the page component with the layout component
 */
export function generateLayoutWrapper(pageImportPath: any, layoutImportPath: any, componentName?: string): string;
/**
 * Compile layouts directory - transpiles layout files to .bertui/compiled/layouts/
 */
export function compileLayouts(root: any, compiledDir: any): Promise<{}>;
/**
 * Inject layout into router generation
 * Called by router-generator to wrap page components with their layouts
 */
export function injectLayoutsIntoRouter(routes: any, layouts: any, compiledDir: any): any;
//# sourceMappingURL=index.d.ts.map