// bertui/src/build/compiler/file-transpiler.js
import { join, relative, dirname, extname } from 'path';
import { readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import logger from '../../logger/logger.js';
import { replaceEnvInCode } from '../../utils/env.js';
import { buildAliasMap, rewriteAliasImports } from '../../utils/importhow.js';

/**
 * Compile src/ + alias dirs into buildDir.
 */
export async function compileBuildDirectory(srcDir, buildDir, root, envVars, importhow = {}) {
  writeFileSync(
    join(buildDir, 'bunfig.toml'),
    `[build]\njsx = "react"\njsxFactory = "React.createElement"\njsxFragment = "React.Fragment"`.trim()
  );
  logger.info('Created bunfig.toml for classic JSX');

  // Build mode: aliases resolve to buildDir/<alias> so relative paths inside dist/ are correct
  const aliasMap = buildAliasMap(importhow, root, buildDir);

  // Compile src/
  await _compileDir(srcDir, buildDir, root, envVars, aliasMap);

  // Compile each alias source dir → buildDir/<alias>
  for (const [alias, relPath] of Object.entries(importhow)) {
    const absAliasDir = join(root, relPath);

    if (!existsSync(absAliasDir)) {
      logger.warn(`⚠️  importhow alias "${alias}" points to missing dir: ${absAliasDir}`);
      continue;
    }

    const aliasOutDir = join(buildDir, alias);
    mkdirSync(aliasOutDir, { recursive: true });

    logger.info(`📦 Compiling alias dir [${alias}] → ${aliasOutDir}`);
    await _compileDir(absAliasDir, aliasOutDir, root, envVars, aliasMap);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function _compileDir(srcDir, buildDir, root, envVars, aliasMap) {
  const files = readdirSync(srcDir);
  const filesToCompile = [];

  for (const file of files) {
    const srcPath = join(srcDir, file);
    const stat    = statSync(srcPath);

    if (stat.isDirectory()) {
      const subBuildDir = join(buildDir, file);
      mkdirSync(subBuildDir, { recursive: true });
      await _compileDir(srcPath, subBuildDir, root, envVars, aliasMap);
    } else {
      const ext = extname(file);
      if (ext === '.css') continue;
      if (['.jsx', '.tsx', '.ts'].includes(ext)) {
        filesToCompile.push({ path: srcPath, dir: buildDir, name: file, type: 'tsx' });
      } else if (ext === '.js') {
        filesToCompile.push({ path: srcPath, dir: buildDir, name: file, type: 'js' });
      }
    }
  }

  if (filesToCompile.length === 0) return;

  logger.info(`📦 Compiling ${filesToCompile.length} files in ${srcDir.split('/').slice(-2).join('/')}...`);

  for (let i = 0; i < filesToCompile.length; i++) {
    const file = filesToCompile[i];
    try {
      if (file.type === 'tsx') {
        await _compileTSXFile(file.path, file.dir, file.name, root, envVars, buildDir, aliasMap);
      } else {
        await _compileJSFile(file.path, file.dir, file.name, root, envVars, aliasMap);
      }

      if ((i + 1) % 10 === 0 || i === filesToCompile.length - 1) {
        const pct = (((i + 1) / filesToCompile.length) * 100).toFixed(0);
        logger.info(`   Progress: ${i + 1}/${filesToCompile.length} (${pct}%)`);
      }
    } catch (error) {
      logger.error(`Failed to compile ${file.name}: ${error.message}`);
    }
  }

  logger.success(`✅ Compiled ${filesToCompile.length} files`);
}

// NEW FUNCTION: Rewrite node_module bare imports
function _rewriteNodeModuleImports(code) {
  // Match: import ... from 'package-name' (but not relative or alias imports)
  const bareImportRegex = /from\s+['"]([^'"./][^'"]*?)['"]/g;
  
  return code.replace(bareImportRegex, (match, pkgName) => {
    // Skip if it's an alias (already handled by rewriteAliasImports)
    if (pkgName.startsWith('amani') || pkgName.startsWith('ui')) {
      return match;
    }
    
    // Skip if it's a URL import
    if (pkgName.startsWith('http://') || pkgName.startsWith('https://')) {
      return match;
    }
    
    // Convert bare specifier to node_modules path
    // Examples:
    // 'date-fns' → '/node_modules/date-fns/index.js'
    // 'lodash/merge' → '/node_modules/lodash/merge.js'
    
    // Handle subpaths (e.g., 'date-fns/format')
    if (pkgName.includes('/')) {
      const [basePkg, ...subPath] = pkgName.split('/');
      const subPathStr = subPath.join('/');
      return `from '/node_modules/${basePkg}/${subPathStr}.js'`;
    }
    
    // Simple package import
    return `from '/node_modules/${pkgName}/index.js'`;
  });
}

async function _compileTSXFile(srcPath, buildDir, filename, root, envVars, configDir, aliasMap) {
  const ext = extname(filename);

  try {
    let code = await Bun.file(srcPath).text();
    code = _removeCSSImports(code);
    code = replaceEnvInCode(code, envVars);

    const outFilename = filename.replace(/\.(jsx|tsx|ts)$/, '.js');
    const outPath     = join(buildDir, outFilename);

    code = _fixBuildImports(code, srcPath, outPath, root);

    if (!code.includes('import React')) {
      code = `import React from 'react';\n${code}`;
    }

    const transpiler = new Bun.Transpiler({
      loader: ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx',
      target: 'browser',
      define: { 'process.env.NODE_ENV': '"production"' },
      tsconfig: {
        compilerOptions: {
          jsx: 'react',
          jsxFactory: 'React.createElement',
          jsxFragmentFactory: 'React.Fragment',
          target: 'ES2020'
        }
      }
    });

    let compiled = await transpiler.transform(code);

    if (compiled.includes('jsxDEV')) {
      logger.warn(`⚠️  Dev JSX in ${filename}, fixing...`);
      compiled = compiled.replace(/jsxDEV/g, 'jsx');
    }

    compiled = _fixRelativeImports(compiled);

    // ✅ Alias rewrite AFTER transpile — Bun won't undo it
    compiled = rewriteAliasImports(compiled, outPath, aliasMap);
    
    // ✅ Rewrite node_module imports for TSX files
    compiled = _rewriteNodeModuleImports(compiled);

    await Bun.write(outPath, compiled);

  } catch (error) {
    logger.error(`Failed to compile ${filename}: ${error.message}`);
    throw error;
  }
}

async function _compileJSFile(srcPath, buildDir, filename, root, envVars, aliasMap) {
  const outPath = join(buildDir, filename);
  let code = await Bun.file(srcPath).text();
  code = _removeCSSImports(code);
  code = replaceEnvInCode(code, envVars);
  code = _fixBuildImports(code, srcPath, outPath, root);

  // JS files don't go through Bun.Transpiler so rewrite is safe here
  code = rewriteAliasImports(code, outPath, aliasMap);
  
  // ✅ Rewrite node_module imports for JS files
  code = _rewriteNodeModuleImports(code);

  if (_usesJSX(code) && !code.includes('import React')) {
    code = `import React from 'react';\n${code}`;
  }

  await Bun.write(outPath, code);
}

// ─────────────────────────────────────────────────────────────────────────────

function _usesJSX(code) {
  return code.includes('React.createElement') ||
         code.includes('React.Fragment')      ||
         /<[A-Z]/.test(code);
}

function _removeCSSImports(code) {
  code = code.replace(/import\s+['"][^'"]*\.css['"];?\s*/g, '');
  code = code.replace(/import\s+['"]bertui\/styles['"]\s*;?\s*/g, '');
  return code;
}

function _fixBuildImports(code, srcPath, outPath, root) {
  const buildDir    = join(root, '.bertuibuild');
  const routerPath  = join(buildDir, 'router.js');
  const rel         = relative(dirname(outPath), routerPath).replace(/\\/g, '/');
  const routerImport = rel.startsWith('.') ? rel : './' + rel;
  code = code.replace(/from\s+['"]bertui\/router['"]/g, `from '${routerImport}'`);
  return code;
}

function _fixRelativeImports(code) {
  const importRegex = /from\s+['"](\.\.[\\/]|\.\/)(?:[^'"]+?)(?<!\.js|\.jsx|\.ts|\.tsx|\.json)['"]/g;
  code = code.replace(importRegex, (match) => {
    if (/\.\w+['"]/.test(match)) return match;
    return match.replace(/['"]$/, '.js"');
  });
  return code;
}