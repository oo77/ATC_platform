# Fix definePageMeta type issues in Vue files

$files = @(
    "app\pages\library\[id].vue",
    "app\pages\library\index.vue"
)

$processed = 0

foreach ($filePath in $files) {
    $fullPath = Join-Path "D:\Projects\ATC_platform" $filePath
    if (Test-Path $fullPath) {
        $content = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
        $originalContent = $content
        
        # Fix middleware type
        $content = $content -replace 'middleware:\s*\["auth"\]', 'middleware: "auth" as any'
        $content = $content -replace 'middleware:\s*"auth"([^,])', 'middleware: "auth" as any$1'
        
        # Fix layout type
        $content = $content -replace 'layout:\s*"admin"([^,])', 'layout: "admin" as any$1'
        $content = $content -replace 'layout:\s*"default"([^,])', 'layout: "default" as any$1'
        
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($fullPath, $content, [System.Text.Encoding]::UTF8)
            Write-Host "Fixed: $filePath" -ForegroundColor Green
            $processed++
        }
    } else {
        Write-Host "Not found: $filePath" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Processed: $processed files" -ForegroundColor Cyan
