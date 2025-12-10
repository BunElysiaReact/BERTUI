// src/client/compiler.js
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import logger from '../logger/logger.js';

export async function compileProject(root) {
  logger.bigLog('COMPILING PROJECT', { color: 'blue' });
  
  const srcDir = join(root, 'src');
  const outDir = join(root, '.bertui', 'compiled');
  
  // Check if src exists
  if (!existsSync(srcDir)) {
    logger.error('src/ directory not found!');
    process.exit(1);
  }
  
  // Create output directory
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
    logger.info('Created .bertui/compiled/');
  }
  
  // Compile all files
  const startTime = Date.now();
  const stats = await compileDirectory(srcDir, outDir, root);
  const duration = Date.now() - startTime;
  
  logger.success(`Compiled ${stats.files} files in ${duration}ms`);
  logger.info(`Output: ${outDir}`);
  
  return { outDir, stats };
}

async function compileDirectory(srcDir, outDir, root) {
  const stats = { files: 0, skipped: 0 };
  
  const files = readdirSync(srcDir);
  
  for (const file of files) {
    const srcPath = join(srcDir, file);
    const stat = statSync(srcPath);
    
    if (stat.isDirectory()) {
      // Recursively compile subdirectories
      const subOutDir = join(outDir, file);
      mkdirSync(subOutDir, { recursive: true });
      const subStats = await compileDirectory(srcPath, subOutDir, root);
      stats.files += subStats.files;
      stats.skipped += subStats.skipped;
    } else {
      // Compile file
      const ext = extname(file);
      const relativePath = relative(join(root, 'src'), srcPath);
      
      if (['.jsx', '.tsx', '.ts'].includes(ext)) {
        await compileFile(srcPath, outDir, file, relativePath);
        stats.files++;
      } else if (ext === '.js' || ext === '.css') {
        // Copy as-is
        const outPath = join(outDir, file);
        await Bun.write(outPath, Bun.file(srcPath));
        logger.debug(`Copied: ${relativePath}`);
        stats.files++;
      } else {
        logger.debug(`Skipped: ${relativePath}`);
        stats.skipped++;
      }
    }
  }
  
  return stats;
}

async function compileFile(srcPath, outDir, filename, relativePath) {
  const ext = extname(filename);
  const loader = ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx';
  
  try {
    const transpiler = new Bun.Transpiler({ loader });
    const code = await Bun.file(srcPath).text();
    const compiled = await transpiler.transform(code);
    
    // Change extension to .js
    const outFilename = filename.replace(/\.(jsx|tsx|ts)$/, '.js');
    const outPath = join(outDir, outFilename);
    
    await Bun.write(outPath, compiled);
    logger.debug(`Compiled: ${relativePath} → ${outFilename}`);
  } catch (error) {
    logger.error(`Failed to compile ${relativePath}: ${error.message}`);
    throw error;
  }
}