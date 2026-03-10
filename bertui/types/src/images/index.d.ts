export function isImageFile(filename: any): boolean;
export function copyImagesSync(srcDir: any, destDir: any): {
    copied: number;
    skipped: number;
};
export function getImageContentType(ext: any): any;
export function getImageFiles(dir: any, baseDir?: any): any[];
export function getTotalImageSize(images: any): any;
export function formatBytes(bytes: any): string;
export const IMAGE_EXTENSIONS: string[];
export { optimizeImages, copyImages } from "../build/image-optimizer.js";
//# sourceMappingURL=index.d.ts.map