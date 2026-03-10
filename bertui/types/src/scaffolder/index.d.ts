export function scaffold(type: any, name: any, options?: {}): Promise<any>;
/**
 * Parse CLI args for the create command
 * Usage: bertui create component Button
 *        bertui create page About
 *        bertui create layout default
 *        bertui create loading blog
 *        bertui create middleware
 */
export function parseCreateArgs(args: any): {
    type: any;
    name: any;
} | null;
//# sourceMappingURL=index.d.ts.map