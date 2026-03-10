export function printHeader(mode?: string): void;
export function step(index: any, total: any, label: any, detail?: string): void;
export function stepDone(label: any, detail?: string): void;
export function stepFail(label: any, detail?: string): void;
export function fileProgress(current: any, total: any, filename: any): void;
export function info(msg: any): void;
export function success(msg: any): void;
export function warn(msg: any): void;
export function error(msg: any): void;
export function debug(msg: any): void;
export function table(rows: any): void;
export function bigLog(title: any, opts?: {}): void;
export function printSummary(stats?: {}): void;
declare namespace _default {
    export { printHeader };
    export { step };
    export { stepDone };
    export { stepFail };
    export { fileProgress };
    export { info };
    export { success };
    export { warn };
    export { error };
    export { debug };
    export { table };
    export { bigLog };
    export { printSummary };
}
export default _default;
//# sourceMappingURL=logger.d.ts.map