/**
 * Discover per-route loading components from src/pages/
 * Convention: create a loading.tsx next to your page file
 * e.g., src/pages/blog/loading.tsx → shown while /blog loads
 */
export function discoverLoadingComponents(root: any): Promise<{}>;
/**
 * Compile loading components to .bertui/compiled/loading/
 */
export function compileLoadingComponents(root: any, compiledDir: any): Promise<{}>;
/**
 * Generate loading-aware router code
 * Wraps each route component with Suspense + loading fallback
 */
export function generateLoadingAwareRouter(routes: any, loadingComponents: any): {
    loadingImports: string;
    getLoadingComponent: (route: any) => string | null;
};
/**
 * Generate the default loading screen script to inject into HTML
 */
export function getLoadingScript(customText?: string, color?: string): string;
/**
 * Default loading spinner HTML injected into pages
 * Beautiful, zero-dependency, CSS-only spinner
 */
export const DEFAULT_LOADING_HTML: "\n<div id=\"bertui-loading\" style=\"\n  position: fixed;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background: rgba(255,255,255,0.95);\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  z-index: 99999;\n  font-family: system-ui, sans-serif;\n  transition: opacity 0.2s ease;\n\">\n  <div style=\"\n    width: 40px;\n    height: 40px;\n    border: 3px solid #e5e7eb;\n    border-top-color: #10b981;\n    border-radius: 50%;\n    animation: bertui-spin 0.7s linear infinite;\n  \"></div>\n  <p style=\"margin-top: 16px; color: #6b7280; font-size: 14px; font-weight: 500;\">Loading...</p>\n</div>\n<style>\n  @keyframes bertui-spin {\n    to { transform: rotate(360deg); }\n  }\n</style>\n<script>\n  // Remove loading screen once React mounts\n  window.__BERTUI_HIDE_LOADING__ = function() {\n    const el = document.getElementById('bertui-loading');\n    if (el) {\n      el.style.opacity = '0';\n      setTimeout(() => el.remove(), 200);\n    }\n  };\n  \n  // Fallback: remove after 5s no matter what\n  setTimeout(() => window.__BERTUI_HIDE_LOADING__?.(), 5000);\n  \n  // React root observer - hide when #root gets children\n  const observer = new MutationObserver(() => {\n    const root = document.getElementById('root');\n    if (root && root.children.length > 0) {\n      window.__BERTUI_HIDE_LOADING__?.();\n      observer.disconnect();\n    }\n  });\n  const root = document.getElementById('root');\n  if (root) observer.observe(root, { childList: true, subtree: true });\n</script>\n";
//# sourceMappingURL=index.d.ts.map