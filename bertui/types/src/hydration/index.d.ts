/**
 * Scan source code to determine if a component needs hydration
 */
export function needsHydration(sourceCode: any): boolean;
/**
 * Get which specific interactive features a component uses
 */
export function getInteractiveFeatures(sourceCode: any): {
    type: string;
    name: string;
}[];
/**
 * Analyze all routes and classify them
 * Returns: { static: [], interactive: [], mixed: [] }
 */
export function analyzeRoutes(routes: any): Promise<{
    static: never[];
    interactive: never[];
    mixed: never[];
}>;
/**
 * Generate hydration-aware router that skips JS for static routes
 * Key insight: static routes still render HTML, just skip React.hydrate()
 */
export function generatePartialHydrationCode(routes: any, analyzedRoutes: any): {
    imports: any;
    routeConfigs: any;
};
/**
 * Log hydration analysis results
 */
export function logHydrationReport(analyzedRoutes: any): void;
//# sourceMappingURL=index.d.ts.map