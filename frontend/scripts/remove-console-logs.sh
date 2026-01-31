#!/bin/bash

# Console Log Cleanup Script for Arise HRM
# Simple version that removes console statements from TypeScript/TSX files

echo "🧹 Starting Console Log Cleanup..."

# Create backup directory
BACKUP_DIR=".console-log-backups"
mkdir -p "$BACKUP_DIR"

# Counter variables
files_processed=0
files_modified=0
statements_removed=0

# Find all TypeScript and TSX files
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    # Skip certain files
    if [[ "$file" == *"loggingService"* ]] || [[ "$file" == *"test"* ]] || [[ "$file" == *"spec"* ]]; then
        continue
    fi
    
    files_processed=$((files_processed + 1))
    echo "Processing: $file"
    
    # Count console statements in the file
    console_count=$(grep -c "console\." "$file" 2>/dev/null || echo "0")
    
    if [ "$console_count" -gt 0 ]; then
        # Create backup
        backup_file="$BACKUP_DIR/$(basename "$file").$(date +%Y%m%d_%H%M%S).backup"
        cp "$file" "$backup_file"
        
        # Remove console statements
        sed -i.tmp '/console\./d' "$file"
        rm "$file.tmp" 2>/dev/null || true
        
        files_modified=$((files_modified + 1))
        statements_removed=$((statements_removed + console_count))
        
        echo "  ✓ Removed $console_count console statements from $file"
        echo "  📝 Backup created: $backup_file"
    fi
done

echo ""
echo "✅ Console log cleanup completed!"
echo "📊 Summary:"
echo "   Files processed: $files_processed"
echo "   Files modified: $files_modified" 
echo "   Console statements removed: $statements_removed"
echo ""
echo "🔍 Next steps:"
echo "1. Test the application to ensure it still works"
echo "2. Add proper logging where needed using the logging service"
echo "3. Build the project: npm run build"
echo "4. Remove backup files once satisfied: rm -rf $BACKUP_DIR"
