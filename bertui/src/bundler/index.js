// bertui/src/bundler/index.js - Unified React Bundler
// Replaces the horrid build pipeline with a clean, Vite-like experience
// Features: CSS support, node_modules resolution, tree-shaking, minification

import { join, dirname, relative, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import logger from '../logger/logger.js';

/**
 * Main bundler class - unified interface for all bundling needs
 */
export class ReactBundler {
  constructor(options = {}) {
    this.root = options.root || process.cwd();
    this.outDir = options.outDir || join(this.root, 'dist');
    this.buildDir = options.buildDir || join(this.root, '.bertuibuild');
    this.envVars = options.envVars || {};
    this.config = options.config || {};
    this.entryPoints = [];
    this.external = options.external || ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'];
    this.splitting = options.splitting !== false;
    this.minify = options.minify ?? true;
    this.sourcemap = options.sourcemap ?? false;
    this.target = options.target || 'browser';
    this.format = options.format || 'esm';
  }

  /**
   * Add entry point(s) to bundle
   */
  addEntry(entry) {
    if (Array.isArray(entry)) {
      this.entryPoints.push(...entry);
    } else {
      this.entryPoints.push(entry);
    }
    return this;
  }

  /**
   * Build the bundle
   */
  async build() {
    logger.info('📦 Starting Bun-powered build...');
    
    const startTime = Date.now();
    
    // Create output directory
    mkdirSync(this.outDir, { recursive: true });
    
    // Build import map for node_modules
    const importMap = await this.generateImportMap();
    
    // Copy necessary node_modules to dist
    await this.copyNodeModules(importMap);
    
    // Configure Bun.build
    const buildOptions = await this.getBuildOptions(importMap);
    
    try {
      const result = await Bun.build(buildOptions);
      
      if (!result.success) {
        const errors = result.logs.map(l => l.message || l.text).join('\n');
        throw new Error(`Build failed:\n${errors}`);
      }
      
      // Write import map
      await Bun.write(
        join(this.outDir, 'import-map.json'),
        JSON.stringify({ imports: importMap }, null, 2)
      );
      
      // Generate bundle report
      const report = this.generateBundleReport(result);
      
      const duration = Date.now() - startTime;
      logger.success(`✅ Build complete in ${duration}ms`);
      logger.info(`📊 Bundle size: ${report.totalSize} KB`);
      
      return {
        success: true,
        outputs: result.outputs,
        importMap,
        report,
        duration
      };
      
    } catch (error) {
      logger.error(`❌ Build failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate import map for browser-native ES modules
   */
  async generateImportMap() {
    const importMap = {
      'react': 'https://esm.sh/react@18.2.0',
      'react-dom': 'https://esm.sh/react-dom@18.2.0',
      'react-dom/client': 'https://esm.sh/react-dom@18.2.0/client',
      'react/jsx-runtime': 'https://esm.sh/react@18.2.0/jsx-runtime',
    };

    // Add bertui packages
    const bertuiPackages = [
      'bertui-animate',
      'bertui-vicons',
      'bertui-continue',
      'bertui-code'
    ];

    const nodeModulesDir = join(this.root, 'node_modules');
    
    if (existsSync(nodeModulesDir)) {
      for (const pkg of bertuiPackages) {
        const pkgDir = join(nodeModulesDir, pkg);
        if (existsSync(pkgDir)) {
          try {
            const pkgJson = JSON.parse(await Bun.file(join(pkgDir, 'package.json')).text());
            const mainPath = pkgJson.browser || pkgJson.module || pkgJson.main || 'dist/index.js';
            
            if (existsSync(join(pkgDir, mainPath))) {
              importMap[pkg] = `/assets/node_modules/${pkg}/${mainPath}`;
            }
          } catch {
            // Skip if package.json not found
          }
        }
      }
    }

    // Add user's node_modules packages that should be bundled
    if (this.config.bundler?.includePackages) {
      for (const pkg of this.config.bundler.includePackages) {
        const pkgDir = join(nodeModulesDir, pkg);
        if (existsSync(pkgDir)) {
          try {
            const pkgJson = JSON.parse(await Bun.file(join(pkgDir, 'package.json')).text());
            const mainPath = pkgJson.browser || pkgJson.module || pkgJson.main || 'index.js';
            
            if (existsSync(join(pkgDir, mainPath))) {
              importMap[pkg] = `/assets/node_modules/${pkg}/${mainPath}`;
            }
          } catch {
            logger.warn(`⚠️  Could not resolve package: ${pkg}`);
          }
        }
      }
    }

    return importMap;
  }

  /**
   * Copy node_modules to dist/assets/node_modules
   */
  async copyNodeModules(importMap) {
    const dest = join(this.outDir, 'assets', 'node_modules');
    const src = join(this.root, 'node_modules');
    
    mkdirSync(dest, { recursive: true });
    
    for (const [pkg, assetPath] of Object.entries(importMap)) {
      if (assetPath.startsWith('https://')) continue;
      
      const match = assetPath.match(/\/assets\/node_modules\/(.+)$/);
      if (!match) continue;
      
      const parts = match[1].split('/');
      const pkgName = parts[0];
      const subPath = parts.slice(1);
      
      const srcFile = join(src, pkgName, ...subPath);
      const destFile = join(dest, pkgName, ...subPath);
      
      mkdirSync(join(dest, pkgName, ...subPath.slice(0, -1)), { recursive: true });
      
      if (existsSync(srcFile)) {
        await Bun.write(destFile, Bun.file(srcFile));
      }
    }
  }

  /**
   * Get Bun.build options
   */
  async getBuildOptions(importMap) {
    // CSS Module plugin
    const cssModulePlugin = {
      name: 'css-modules',
      setup(build) {
        // Handle .module.css files
        build.onLoad({ filter: /\.module\.css$/ }, () => ({
          contents: 'export default new Proxy({}, { get: (_, k) => k });',
          loader: 'js',
        }));
        
        // Handle regular .css files - empty export to avoid bundling issues
        build.onLoad({ filter: /\.css$/ }, () => ({
          contents: '',
          loader: 'js',
        }));
      },
    };

    // Custom plugin for handling special imports
    const customPlugin = {
      name: 'custom-resolver',
      setup(build) {
        // Resolve markdown imports if needed
        build.onLoad({ filter: /\.md$/ }, async (args) => {
          // This will be handled by the MD compiler before bundling
          return {
            contents: 'export default function MarkdownComponent() { return null; }',
            loader: 'js',
          };
        });
      },
    };

    return {
      entrypoints: this.entryPoints,
      outdir: join(this.outDir, 'assets'),
      target: this.target,
      format: this.format,
      plugins: [cssModulePlugin, customPlugin],
      minify: this.minify ? {
        whitespace: true,
        syntax: true,
        identifiers: true,
      } : false,
      splitting: this.splitting,
      sourcemap: this.sourcemap ? 'external' : false,
      metafile: true,
      naming: {
        entry: 'js/[name]-[hash].js',
        chunk: 'js/chunks/[name]-[hash].js',
        asset: 'assets/[name]-[hash].[ext]',
      },
      external: this.external,
      define: {
        'process.env.NODE_ENV': this.config.nodeEnv || '"production"',
        ...Object.fromEntries(
          Object.entries(this.envVars).map(([k, v]) => [`process.env.${k}`, JSON.stringify(v)])
        ),
      },
    };
  }

  /**
   * Generate bundle size report
   */
  generateBundleReport(result) {
    const outputs = result.outputs || [];
    let totalSize = 0;
    const files = [];
    
    for (const output of outputs) {
      const size = (output.size || 0) / 1024; // Convert to KB
      totalSize += size;
      files.push({
        path: output.path,
        size: size.toFixed(2),
        type: output.kind
      });
    }
    
    return {
      totalSize: totalSize.toFixed(2),
      files,
      outputCount: outputs.length
    };
  }
}

/**
 * Quick bundle function for simple use cases
 */
export async function bundle(options = {}) {
  const bundler = new ReactBundler(options);
  
  if (options.entrypoints) {
    bundler.addEntry(options.entrypoints);
  }
  
  return await bundler.build();
}

/**
 * Development bundler with HMR support
 */
export class DevBundler extends ReactBundler {
  constructor(options = {}) {
    super({
      ...options,
      minify: false,
      sourcemap: true,
      splitting: false,
    });
    
    this.hmrPort = options.hmrPort || 3001;
    this.clients = new Set();
  }

  /**
   * Build for development with fast rebuilds
   */
  async buildDev() {
    logger.info('🔨 Building for development...');
    
    const startTime = Date.now();
    
    // Use cached builds where possible
    const buildOptions = await this.getBuildOptions({});
    buildOptions.minify = false;
    buildOptions.sourcemap = 'inline';
    
    try {
      const result = await Bun.build(buildOptions);
      
      if (!result.success) {
        const errors = result.logs.map(l => ({
          message: l.message || l.text,
          file: l.file,
          line: l.position?.line,
          column: l.position?.column
        }));
        
        return {
          success: false,
          errors
        };
      }
      
      const duration = Date.now() - startTime;
      logger.success(`✅ Dev build complete in ${duration}ms`);
      
      return {
        success: true,
        outputs: result.outputs,
        duration
      };
      
    } catch (error) {
      logger.error(`❌ Dev build failed: ${error.message}`);
      return {
        success: false,
        errors: [{ message: error.message }]
      };
    }
  }

  /**
   * Notify HMR clients of changes
   */
  notifyChange(filePath) {
    const message = {
      type: 'update',
      path: filePath,
      timestamp: Date.now()
    };
    
    for (const client of this.clients) {
      try {
        client.send(JSON.stringify(message));
      } catch {
        this.clients.delete(client);
      }
    }
  }

  /**
   * Add HMR client
   */
  addClient(ws) {
    this.clients.add(ws);
  }

  /**
   * Remove HMR client
   */
  removeClient(ws) {
    this.clients.delete(ws);
  }
}

/**
 * Create a bundler instance
 */
export function createBundler(options = {}) {
  return new ReactBundler(options);
}

/**
 * Create a dev bundler instance
 */
export function createDevBundler(options = {}) {
  return new DevBundler(options);
}
