#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Patterns to match console statements
const consolePatterns = [
  /console\.log\s*\([^)]*\);?\s*/g,
  /console\.error\s*\([^)]*\);?\s*/g,
  /console\.warn\s*\([^)]*\);?\s*/g,
  /console\.info\s*\([^)]*\);?\s*/g,
  /console\.debug\s*\([^)]*\);?\s*/g,
  /console\.trace\s*\([^)]*\);?\s*/g,
  /console\.table\s*\([^)]*\);?\s*/g,
];

// Function to recursively find files
function findFiles(dir, extensions, excludeDirs) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !excludeDirs.includes(item)) {
        files.push(...findFiles(fullPath, extensions, excludeDirs));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return files;
}

// Function to remove console statements from a file
function removeConsoleStatements(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;

    // Remove each console pattern
    consolePatterns.forEach(pattern => {
      const matches = newContent.match(pattern);
      if (matches && matches.length > 0) {
        newContent = newContent.replace(pattern, '');
        modified = true;
      }
    });

    // Remove empty lines that might be left
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (modified) {
      // Create backup
      const backupDir = '.console-log-backups';
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupPath = path.join(backupDir, `${path.basename(filePath)}.${new Date().toISOString().replace(/[:.]/g, '-')}.backup`);
      fs.writeFileSync(backupPath, content);
      
      // Write modified content
      fs.writeFileSync(filePath, newContent);
      
      console.log(`✅ Processed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Starting console statement removal...\n');

  const srcDir = path.join(__dirname, '..', 'src');
  const extensions = ['.js', '.jsx', '.ts', '.tsx'];
  const excludeDirs = ['node_modules', '.console-log-backups', 'dist', 'build', 'coverage'];
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found');
    return;
  }

  const files = findFiles(srcDir, extensions, excludeDirs);
  
  let totalFiles = files.length;
  let processedFiles = 0;
  let errors = 0;

  console.log(`📁 Found ${totalFiles} files to process\n`);

  // Process each file
  for (const filePath of files) {
    try {
      if (removeConsoleStatements(filePath)) {
        processedFiles++;
      }
    } catch (error) {
      errors++;
      console.error(`❌ Failed to process ${filePath}:`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`Total files scanned: ${totalFiles}`);
  console.log(`Files processed: ${processedFiles}`);
  console.log(`Errors: ${errors}`);
  
  if (errors === 0) {
    console.log('\n🎉 Console statement removal completed successfully!');
    console.log('💡 Remember to test your application after these changes.');
  } else {
    console.log('\n⚠️  Some files had errors. Check the logs above.');
  }
}

// Run the script
main().catch(console.error);
