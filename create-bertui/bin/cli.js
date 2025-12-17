#!/usr/bin/env bun
import { promises as fs } from 'fs';
import path from 'path';

const projectName = Bun.argv[2];

// Color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Validate project name
if (!projectName) {
  log('\n❌ Error: Please specify the project name', colors.red);
  log('\nUsage:', colors.yellow);
  log('  bunx create-bertui <app-name>\n', colors.cyan);
  process.exit(1);
}

// Check if project name is valid
const validNameRegex = /^[a-zA-Z0-9-_]+$/;
if (!validNameRegex.test(projectName)) {
  log('\n❌ Error: Invalid project name', colors.red);
  log('Project name can only contain letters, numbers, hyphens, and underscores\n', colors.yellow);
  process.exit(1);
}

const targetDir = path.join(process.cwd(), projectName);
const templateDir = path.join(import.meta.dir, '..', 'template');

// Check if directory already exists
async function checkDirectory() {
  try {
    await fs.access(targetDir);
    log(`\n❌ Error: Directory '${projectName}' already exists`, colors.red);
    log('Please choose a different name or remove the existing directory\n', colors.yellow);
    process.exit(1);
  } catch {
    // Directory doesn't exist, which is what we want
  }
}

// Verify template exists
async function verifyTemplate() {
  try {
    await fs.access(templateDir);
  } catch {
    log('\n❌ Error: Template directory not found', colors.red);
    log('Please ensure create-bertui is installed correctly\n', colors.yellow);
    process.exit(1);
  }
}

// Copy files recursively with progress
async function copyRecursive(src, dest, depth = 0) {
  await fs.mkdir(dest, { recursive: true });
  
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (depth === 0) {
        log(`  📁 Creating ${entry.name}/`, colors.cyan);
      }
      await copyRecursive(srcPath, destPath, depth + 1);
    } else {
      await Bun.write(destPath, Bun.file(srcPath));
      
      // Handle .gitignore rename
      if (entry.name === 'gitignore') {
        await fs.rename(destPath, path.join(dest, '.gitignore'));
      }
    }
  }
}

// Run bun install with proper error handling
async function installDependencies() {
  log('\n📦 Installing dependencies...', colors.cyan);
  
  try {
    const proc = Bun.spawn(['bun', 'install'], {
      cwd: targetDir,
      stdout: 'inherit',
      stderr: 'inherit',
    });
    
    const exitCode = await proc.exited;
    
    if (exitCode !== 0) {
      throw new Error(`bun install exited with code ${exitCode}`);
    }
    
    log('✅ Dependencies installed successfully', colors.green);
  } catch (error) {
    log('\n⚠️  Warning: Failed to install dependencies automatically', colors.yellow);
    log(`Error: ${error.message}`, colors.red);
    log('\nYou can install them manually by running:', colors.yellow);
    log(`  cd ${projectName}`, colors.cyan);
    log(`  bun install\n`, colors.cyan);
    return false;
  }
  
  return true;
}

// Main setup function
async function setup() {
  try {
    log('\n⚡ Creating BertUI project...', colors.bright);
    
    await checkDirectory();
    await verifyTemplate();
    
    log('\n📋 Copying template files...', colors.cyan);
    await copyRecursive(templateDir, targetDir);
    log('✅ Template files copied', colors.green);
    
    const installed = await installDependencies();
    
    // Success message
    log('\n' + '='.repeat(50), colors.green);
    log(`🎉 BertUI App '${projectName}' created successfully!`, colors.bright + colors.green);
    log('='.repeat(50) + '\n', colors.green);
    
    log('👉 Next Steps:', colors.bright);
    log(`  cd ${projectName}`, colors.cyan);
    
    if (!installed) {
      log(`  bun install`, colors.cyan);
    }
    
    log(`  bun run dev`, colors.cyan);
    log('\n💡 Tip: Use "bertui dev" for the fastest dev server experience!\n', colors.yellow);
    
    
  } catch (error) {
    log(`\n❌ Failed to create project: ${error.message}`, colors.red);
    if (error.stack) {
      log(`\nStack trace:\n${error.stack}`, colors.red);
    }
    process.exit(1);
  }
}

setup();