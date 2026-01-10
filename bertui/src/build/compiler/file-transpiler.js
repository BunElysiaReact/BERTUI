// bertui/src/build/compiler/file-transpiler.js - FORCE PRODUCTION JSX
import { join, relative, dirname, extname } from 'path';
import { readdirSync, statSync, mkdirSync, writeFileSync } from 'fs';
import logger from '../../logger/logger.js';
import { replaceEnvInCode } from '../../utils/env.js';

export async function compileBuildDirectory(srcDir, buildDir, root, envVars) {
  // Create bunfig.toml in build directory
  const bunfigContent = `
[build]
jsx = "react"
jsxFactory = "React.createElement"
jsxFragment = "React.Fragment"
`.trim();
  
  writeFileSync(join(buildDir, 'bunfig.toml'), bunfigContent);
  logger.info('Created bunfig.toml for classic JSX');
  
  const files = readdirSync(srcDir);
  const filesToCompile = [];
  
  for (const file of files) {
    const srcPath = join(srcDir, file);
    const stat = statSync(srcPath);
    
    if (stat.isDirectory()) {
      const subBuildDir = join(buildDir, file);
      mkdirSync(subBuildDir, { recursive: true });
      await compileBuildDirectory(srcPath, subBuildDir, root, envVars);
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
  
  logger.info(`📦 Compiling ${filesToCompile.length} files...`);
  
  for (let i = 0; i < filesToCompile.length; i++) {
    const file = filesToCompile[i];
    
    try {
      if (file.type === 'tsx') {
        await compileBuildFile(file.path, file.dir, file.name, root, envVars, buildDir);
      } else {
        await compileJSFile(file.path, file.dir, file.name, root, envVars);
      }
      
      if ((i + 1) % 10 === 0 || i === filesToCompile.length - 1) {
        const percent = (((i + 1) / filesToCompile.length) * 100).toFixed(0);
        logger.info(`   Progress: ${i + 1}/${filesToCompile.length} (${percent}%)`);
      }
      
    } catch (error) {
      logger.error(`Failed to compile ${file.name}: ${error.message}`);
    }
  }
  
  logger.success(`✅ Compiled ${filesToCompile.length} files`);
}

async function compileBuildFile(srcPath, buildDir, filename, root, envVars, configDir) {
  const ext = extname(filename);
  
  try {
    let code = await Bun.file(srcPath).text();
    code = removeCSSImports(code);
    code = replaceEnvInCode(code, envVars);
    
    const outFilename = filename.replace(/\.(jsx|tsx|ts)$/, '.js');
    const outPath = join(buildDir, outFilename);
    code = fixBuildImports(code, srcPath, outPath, root);
    
    // Add React import BEFORE transpiling
    if (!code.includes('import React')) {
      code = `import React from 'react';\n${code}`;
    }
    
    // Use Bun.Transpiler with explicit production settings
    const transpiler = new Bun.Transpiler({
      loader: ext === '.tsx' ? 'tsx' : ext === '.ts' ? 'ts' : 'jsx',
      target: 'browser',
      define: {
        'process.env.NODE_ENV': '"production"'
      },
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
    
    // Verify no dev JSX leaked through
    if (compiled.includes('jsxDEV')) {
      logger.warn(`⚠️  Dev JSX detected in ${filename}, fixing...`);
      compiled = compiled.replace(/jsxDEV/g, 'jsx');
    }
    
    compiled = fixRelativeImports(compiled);
    await Bun.write(outPath, compiled);
    
    code = null;
    compiled = null;
    
  } catch (error) {
    logger.error(`Failed to compile ${filename}: ${error.message}`);
    throw error;
  }
}

async function compileJSFile(srcPath, buildDir, filename, root, envVars) {
  const outPath = join(buildDir, filename);
  let code = await Bun.file(srcPath).text();
  code = removeCSSImports(code);
  code = replaceEnvInCode(code, envVars);
  code = fixBuildImports(code, srcPath, outPath, root);
  
  if (usesJSX(code) && !code.includes('import React')) {
    code = `import React from 'react';\n${code}`;
  }
  
  await Bun.write(outPath, code);
  code = null;
}

function usesJSX(code) {
  return code.includes('React.createElement') || 
         code.includes('React.Fragment') ||
         /<[A-Z]/.test(code);
}

function removeCSSImports(code) {
  code = code.replace(/import\s+['"][^'"]*\.css['"];?\s*/g, '');
  code = code.replace(/import\s+['"]bertui\/styles['"]\s*;?\s*/g, '');
  return code;
}

function fixBuildImports(code, srcPath, outPath, root) {
  const buildDir = join(root, '.bertuibuild');
  const routerPath = join(buildDir, 'router.js');
  const relativeToRouter = relative(dirname(outPath), routerPath).replace(/\\/g, '/');
  const routerImport = relativeToRouter.startsWith('.') ? relativeToRouter : './' + relativeToRouter;
  
  code = code.replace(/from\s+['"]bertui\/router['"]/g, `from '${routerImport}'`);
  return code;
}

function fixRelativeImports(code) {
  const importRegex = /from\s+['"](\.\.[\/\\]|\.\/)((?:[^'"]+?)(?<!\.js|\.jsx|\.ts|\.tsx|\.json))['"];?/g;
  code = code.replace(importRegex, (match, prefix, path) => {
    if (path.endsWith('/') || /\.\w+$/.test(path)) return match;
    return `from '${prefix}${path}.js';`;
  });
  return code;
}
