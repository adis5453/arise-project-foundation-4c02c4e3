#!/usr/bin/env node

/**
 * Automated Console Log Cleanup Script for Arise HRM
 * 
 * This script:
 * 1. Finds all console.* statements in TypeScript/TSX files
 * 2. Replaces them with proper logging service calls
 * 3. Creates backups before making changes
 * 4. Generates a report of changes made
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  srcDir: path.join(__dirname, '../src'),
  backupDir: path.join(__dirname, '../.console-log-backups'),
  reportFile: path.join(__dirname, '../console-cleanup-report.md'),
  fileExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.git/',
    '/coverage/',
    'loggingService.ts', // Don't modify our logging service
    'test', // Don't modify test files
    'spec'
  ]
};

class ConsoleCleanup {
  constructor() {
    this.stats = {
      filesProcessed: 0,
      filesModified: 0,
      consoleStatementsRemoved: 0,
      errors: []
    };
    this.changes = [];
  }

  async run() {
    console.log('🧹 Starting Console Log Cleanup...\n');
    
    // Create backup directory
    this.ensureDirectoryExists(CONFIG.backupDir);
    
    // Find all relevant files
    const files = await this.findFiles(CONFIG.srcDir);
    console.log(`📁 Found ${files.length} files to process\n`);
    
    // Process each file
    for (const filePath of files) {
      await this.processFile(filePath);
    }
    
    // Generate report
    await this.generateReport();
    
    console.log('\n✅ Console log cleanup completed!');
    console.log(`📊 Summary:`);
    console.log(`   Files processed: ${this.stats.filesProcessed}`);
    console.log(`   Files modified: ${this.stats.filesModified}`);
    console.log(`   Console statements removed: ${this.stats.consoleStatementsRemoved}`);
    
    if (this.stats.errors.length > 0) {
      console.log(`   Errors: ${this.stats.errors.length}`);
      console.log(`📄 Check ${CONFIG.reportFile} for detailed report\n`);
    }
  }

  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  async findFiles(dir) {
    const files = [];
    
    const walk = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        
        // Skip excluded patterns
        if (CONFIG.excludePatterns.some(pattern => fullPath.includes(pattern))) {
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (this.isValidFile(fullPath)) {
          files.push(fullPath);
        }
      }
    };
    
    walk(dir);
    return files;
  }

  isValidFile(filePath) {
    return CONFIG.fileExtensions.some(ext => filePath.endsWith(ext));
  }

  async processFile(filePath) {
    try {
      this.stats.filesProcessed++;
      
      const originalContent = fs.readFileSync(filePath, 'utf8');
      const { cleanedContent, removedCount, replacements } = this.cleanConsoleStatements(originalContent, filePath);
      
      if (removedCount > 0) {
        // Create backup
        const backupPath = this.createBackup(filePath, originalContent);
        
        // Write cleaned content
        fs.writeFileSync(filePath, cleanedContent);
        
        // Track changes
        this.stats.filesModified++;
        this.stats.consoleStatementsRemoved += removedCount;
        
        this.changes.push({
          file: path.relative(CONFIG.srcDir, filePath),
          removedCount,
          replacements,
          backupPath
        });
        
        console.log(`🔧 ${path.basename(filePath)}: Removed ${removedCount} console statements`);
      }
    } catch (error) {
      this.stats.errors.push({
        file: filePath,
        error: error.message
      });
      console.error(`❌ Error processing ${filePath}: ${error.message}`);
    }
  }

  cleanConsoleStatements(content, filePath) {
    let cleanedContent = content;
    let removedCount = 0;
    const replacements = [];
    
    // Add import for logging service if needed
    if (content.includes('console.')) {
      const hasLoggingImport = content.includes("from '../services/loggingService'") || 
                             content.includes("from './services/loggingService'") ||
                             content.includes("from '../../services/loggingService'");
      
      if (!hasLoggingImport) {
        const relativePath = this.getRelativeImportPath(filePath);
        const importStatement = `import { log } from '${relativePath}/services/loggingService';\n`;
        
        // Add import after existing imports
        const lines = cleanedContent.split('\n');
        let insertIndex = 0;
        
        // Find last import or first non-comment line
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('export ')) {
            insertIndex = i + 1;
          } else if (lines[i].trim() && !lines[i].trim().startsWith('//') && !lines[i].trim().startsWith('/*')) {
            break;
          }
        }
        
        lines.splice(insertIndex, 0, importStatement);
        cleanedContent = lines.join('\n');
      }
    }

    // Pattern matching for various console statement formats
    const consolePatterns = [
      // Simple console.log statements
      {
        pattern: /^\s*console\.(log|info|warn|error|debug)\s*\([^)]*\)\s*;?\s*$/gm,
        replacement: (match, method, offset) => {
          const level = method === 'log' ? 'info' : method;
          removedCount++;
          
          // Extract the arguments
          const argsMatch = match.match(/console\.\w+\s*\(([^)]*)\)/);
          if (argsMatch && argsMatch[1].trim()) {
            const args = argsMatch[1];
            replacements.push(`log.${level}(${args});`);
            return `  log.${level}(${args});`;
          } else {
            return ''; // Remove empty console statements
          }
        }
      },
      
      // Multi-line console statements
      {
        pattern: /console\.(log|info|warn|error|debug)\s*\(\s*[^)]*\);?/g,
        replacement: (match, method) => {
          const level = method === 'log' ? 'info' : method;
          removedCount++;
          
          // For complex multi-line statements, just remove them
          // The developer can manually add proper logging where needed
          replacements.push(`// TODO: Add proper logging with log.${level}()`);
          return `// TODO: Add proper logging with log.${level}()`;
        }
      }
    ];

    // Apply patterns
    consolePatterns.forEach(({ pattern, replacement }) => {
      cleanedContent = cleanedContent.replace(pattern, replacement);
    });

    // Clean up any remaining standalone console statements
    cleanedContent = cleanedContent.replace(/^\s*console\.\w+.*$/gm, (match) => {
      if (!match.includes('log.')) { // Don't remove our new logging statements
        removedCount++;
        return '// TODO: Add proper logging';
      }
      return match;
    });

    // Remove consecutive empty lines
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    return { cleanedContent, removedCount, replacements };
  }

  getRelativeImportPath(filePath) {
    const relativePath = path.relative(path.dirname(filePath), CONFIG.srcDir);
    return relativePath.replace(/\\/g, '/') || '.';
  }

  createBackup(filePath, content) {
    const relativePath = path.relative(CONFIG.srcDir, filePath);
    const backupPath = path.join(CONFIG.backupDir, relativePath);
    
    // Ensure backup directory exists
    this.ensureDirectoryExists(path.dirname(backupPath));
    
    // Add timestamp to backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupWithTimestamp = `${backupPath}.${timestamp}.backup`;
    
    fs.writeFileSync(backupWithTimestamp, content);
    return backupWithTimestamp;
  }

  async generateReport() {
    const reportContent = this.createReportContent();
    fs.writeFileSync(CONFIG.reportFile, reportContent);
  }

  createReportContent() {
    const timestamp = new Date().toISOString();
    
    let report = `# Console Log Cleanup Report\n\n`;
    report += `**Generated**: ${timestamp}\n\n`;
    report += `## Summary\n\n`;
    report += `- **Files Processed**: ${this.stats.filesProcessed}\n`;
    report += `- **Files Modified**: ${this.stats.filesModified}\n`;
    report += `- **Console Statements Removed**: ${this.stats.consoleStatementsRemoved}\n`;
    report += `- **Errors**: ${this.stats.errors.length}\n\n`;

    if (this.changes.length > 0) {
      report += `## Files Modified\n\n`;
      this.changes.forEach(change => {
        report += `### ${change.file}\n`;
        report += `- **Console statements removed**: ${change.removedCount}\n`;
        report += `- **Backup created**: ${change.backupPath}\n\n`;
        
        if (change.replacements.length > 0) {
          report += `**Replacements made**:\n`;
          change.replacements.forEach(replacement => {
            report += `- \`${replacement}\`\n`;
          });
          report += '\n';
        }
      });
    }

    if (this.stats.errors.length > 0) {
      report += `## Errors Encountered\n\n`;
      this.stats.errors.forEach(error => {
        report += `- **${error.file}**: ${error.error}\n`;
      });
      report += '\n';
    }

    report += `## Next Steps\n\n`;
    report += `1. Review the modified files and test the application\n`;
    report += `2. Add proper logging statements using the \`log\` service where needed\n`;
    report += `3. Update any TODO comments with actual logging calls\n`;
    report += `4. Configure remote logging endpoint in production environment\n`;
    report += `5. Remove backup files once satisfied with changes\n\n`;

    return report;
  }
}

// Run the cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cleanup = new ConsoleCleanup();
  cleanup.run().catch(console.error);
}

export default ConsoleCleanup;
