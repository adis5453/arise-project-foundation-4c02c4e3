$filePath = "d:\New folder\arise_hrm\Arise\frontend\src\components\leave\LeaveManager.tsx"
$content = Get-Content $filePath
$newContent = @()

# Keep lines 0-505 (0-indexed, so 0-504 inclusive)
for ($i = 0; $i -lt 505; $i++) {
    $newContent += $content[$i]
}

# Skip lines 505-714 (the orphaned code)

# Keep lines from 715 onwards
for ($i = 715; $i -lt $content.Length; $i++) {
    $newContent += $content[$i]
}

# Write back
$newContent | Set-Content $filePath -Encoding UTF8
Write-Host "Deleted lines 506-715 successfully!"
