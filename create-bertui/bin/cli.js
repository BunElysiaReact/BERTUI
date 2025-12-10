#!/usr/bin/env bun
import { promises as fs } from 'fs';
import path from 'path';

// --- 1. Get arguments
const projectName = Bun.argv[2]; // Bun.argv is similar to process.argv

if (!projectName) {
  console.error("Please specify the project name: bunx create-bertui <app-name>");
  process.exit(1);
}

const targetDir = path.join(process.cwd(), projectName);
const templateDir = path.join(import.meta.dir, '..', 'template'); // Locate the template folder

// --- 2. Define the core recursive copy logic
async function copyRecursive(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  
  // Use readdir for fast directory reading
  const entries = await fs.readdir(src, { withFileTypes: true }); 

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath);
    } else {
      // Bun.file(srcPath) is a fast way to get file contents
      await Bun.write(destPath, Bun.file(srcPath)); 
      
      // Special case: NPM removes .gitignore, so we rename it in the template
      if (entry.name === 'gitignore') {
        await fs.rename(destPath, path.join(dest, '.gitignore'));
      }
    }
  }
}

// --- 3. Execute setup
try {
  await copyRecursive(templateDir, targetDir);
  
  // Run install (Bun will handle this faster than npm/yarn)
  const install = Bun.spawn(['bun', 'install'], { cwd: targetDir });
  await install.exited; // Wait for installation to finish

  console.log(`\n🎉 BertUI App '${projectName}' created successfully!`);
  console.log(`\n👉 Next Steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  bertui dev (Starts the fast dev server)`);
  
} catch (error) {
  console.error(`\n❌ Failed to create project: ${error.message}`);
  process.exit(1);
}