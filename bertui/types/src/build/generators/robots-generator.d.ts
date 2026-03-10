/**
 * Generate robots.txt from sitemap data
 * @param {Object} config - BertUI config with baseUrl
 * @param {string} outDir - Output directory (dist/)
 * @param {Array} routes - Optional: routes to disallow (e.g., admin pages)
 */
export function generateRobots(config: Object, outDir: string, routes?: any[]): Promise<{
    path: any;
    content: string;
}>;
//# sourceMappingURL=robots-generator.d.ts.map