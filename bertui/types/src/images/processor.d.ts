/**
 * Check if a file is an image based on extension
 */
export function isImageFile(filename: any): boolean;
/**
 * Get image content type for HTTP headers
 */
export function getImageContentType(ext: any): any;
/**
 * Copy images synchronously from source to destination
 */
export function copyImagesSync(srcDir: any, destDir: any, options?: {}): {
    copied: number;
    skipped: number;
    failed: number;
};
/**
 * Get all image files from a directory recursively
 */
export function getImageFiles(dir: any, baseDir?: any): any[];
/**
 * Calculate total size of images
 */
export function getTotalImageSize(images: any): any;
/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: any): string;
export const IMAGE_EXTENSIONS: string[];
//# sourceMappingURL=processor.d.ts.map