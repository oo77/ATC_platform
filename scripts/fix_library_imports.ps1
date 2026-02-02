# Fix imports in all library API files

$rootPath = "D:\Projects\ATC_platform\server\api\library"

# Get all TypeScript files recursively
$files = Get-ChildItem -Path $rootPath -Recurse -Filter "*.ts"

$processed = 0
$skipped = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $originalContent = $content
    
    # Calculate relative path depth based on file location
    $relativePath = $file.FullName.Substring($rootPath.Length + 1)
    $depth = ($relativePath.Split('\').Length - 1)
    
    # Build relative path string
    $relPath = if ($depth -eq 0) { "." } else { ("..\") * $depth }
    $relPath = $relPath.TrimEnd('\')
    
    # Calculate path to server root
    $serverRelPath = "$relPath\..\..".TrimEnd('\')
    
    # Replace imports
    $modified = $false
    
    if ($content -match '~/server/') {
        $content = $content -replace "from ['""]~/server/utils/([^'""]+)['""]", "from ""$serverRelPath/utils/`$1"""
        $content = $content -replace "from ['""]~/server/repositories/([^'""]+)['""]", "from ""$serverRelPath/repositories/`$1"""
        $content = $content -replace "from ['""]~/server/database['""]", "from ""$serverRelPath/database"""
        $modified = $true
    }
    
    # Replace db import
    if ($content -match 'import \{ db \}') {
        $content = $content -replace 'import \{ db \}', 'import { getDbPool }'
        
        # Add const db = getDbPool(); if not present
        if ($content -notmatch 'const db = getDbPool\(\);') {
            # Find last import statement
            if ($content -match '(import[^;]+;[\r\n]+)([\r\n]+)') {
                $content = $content -replace '(import[^;]+;[\r\n]+)([\r\n]+)', "`$1`$2const db = getDbPool();`$2"
            }
        }
        $modified = $true
    }
    
    if ($modified -and $content -ne $originalContent) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        $processed++
    } else {
        $skipped++
    }
}

Write-Host ""
Write-Host "Processed: $processed files" -ForegroundColor Cyan
Write-Host "Skipped: $skipped files" -ForegroundColor Yellow
