# Console Log Cleanup Script for Arise HRM
# PowerShell version that removes console statements from TypeScript/TSX files

Write-Host "🧹 Starting Console Log Cleanup..." -ForegroundColor Cyan

# Create backup directory
$backupDir = ".console-log-backups"
if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory -Force | Out-Null
}

# Counter variables
$filesProcessed = 0
$filesModified = 0
$statementsRemoved = 0

# Find all TypeScript and TSX files
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx"

foreach ($file in $files) {
    # Skip certain files
    if ($file.Name -like "*loggingService*" -or $file.Name -like "*test*" -or $file.Name -like "*spec*") {
        continue
    }
    
    $filesProcessed++
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Gray
    
    # Read file content
    $content = Get-Content -Path $file.FullName -Raw
    if (-not $content) { continue }
    
    # Count console statements
    $consoleMatches = [regex]::Matches($content, "console\.")
    $consoleCount = $consoleMatches.Count
    
    if ($consoleCount -gt 0) {
        # Create backup
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = Join-Path $backupDir "$($file.BaseName).$timestamp.backup"
        Copy-Item -Path $file.FullName -Destination $backupFile
        
        # Remove console statements (line by line approach)
        $lines = $content -split "`r`n|`r|`n"
        $cleanedLines = @()
        
        foreach ($line in $lines) {
            if ($line -notmatch "^\s*console\." -and $line -notmatch "console\.(log|info|warn|error|debug)") {
                $cleanedLines += $line
            }
        }
        
        # Write cleaned content back
        $cleanedContent = $cleanedLines -join "`r`n"
        Set-Content -Path $file.FullName -Value $cleanedContent -NoNewline
        
        $filesModified++
        $statementsRemoved += $consoleCount
        
        Write-Host "  ✓ Removed $consoleCount console statements from $($file.Name)" -ForegroundColor Green
        Write-Host "  📝 Backup created: $backupFile" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Console log cleanup completed!" -ForegroundColor Green
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Files processed: $filesProcessed"
Write-Host "   Files modified: $filesModified" 
Write-Host "   Console statements removed: $statementsRemoved"
Write-Host ""
Write-Host "🔍 Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the application to ensure it still works"
Write-Host "2. Add proper logging where needed using the logging service"
Write-Host "3. Build the project: npm run build"
Write-Host "4. Remove backup files once satisfied: Remove-Item -Recurse $backupDir"
