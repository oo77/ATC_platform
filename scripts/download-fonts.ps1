# Скрипт загрузки шрифтов из Google Fonts (official ZIP endpoint)
# Run: powershell -ExecutionPolicy Bypass -File scripts\download-fonts.ps1

$fontsDir = Join-Path $PSScriptRoot "..\server\assets\fonts"
$tempDir  = Join-Path $PSScriptRoot "..\temp-fonts"

New-Item -ItemType Directory -Force -Path $fontsDir | Out-Null
New-Item -ItemType Directory -Force -Path $tempDir  | Out-Null

$fonts = @(
    [PSCustomObject]@{ name = "Inter";            key = "Inter";            r400 = "Inter-Regular";           r700 = "Inter-Bold"           }
    [PSCustomObject]@{ name = "Roboto";           key = "Roboto";           r400 = "Roboto-Regular";          r700 = "Roboto-Bold"          }
    [PSCustomObject]@{ name = "Open Sans";        key = "Open_Sans";        r400 = "OpenSans-Regular";        r700 = "OpenSans-Bold"        }
    [PSCustomObject]@{ name = "Montserrat";       key = "Montserrat";       r400 = "Montserrat-Regular";      r700 = "Montserrat-Bold"      }
    [PSCustomObject]@{ name = "Lato";             key = "Lato";             r400 = "Lato-Regular";            r700 = "Lato-Bold"            }
    [PSCustomObject]@{ name = "Poppins";          key = "Poppins";          r400 = "Poppins-Regular";         r700 = "Poppins-Bold"         }
    [PSCustomObject]@{ name = "Playfair Display"; key = "Playfair_Display"; r400 = "PlayfairDisplay-Regular"; r700 = "PlayfairDisplay-Bold" }
    [PSCustomObject]@{ name = "Lora";             key = "Lora";             r400 = "Lora-Regular";            r700 = "Lora-Bold"            }
    [PSCustomObject]@{ name = "Merriweather";     key = "Merriweather";     r400 = "Merriweather-Regular";    r700 = "Merriweather-Bold"    }
    [PSCustomObject]@{ name = "PT Sans";          key = "PT_Sans";          r400 = "PTSans-Regular";          r700 = "PTSans-Bold"          }
    [PSCustomObject]@{ name = "PT Serif";         key = "PT_Serif";         r400 = "PTSerif-Regular";         r700 = "PTSerif-Bold"         }
    [PSCustomObject]@{ name = "Noto Sans";        key = "Noto_Sans";        r400 = "NotoSans-Regular";        r700 = "NotoSans-Bold"        }
    [PSCustomObject]@{ name = "Raleway";          key = "Raleway";          r400 = "Raleway-Regular";         r700 = "Raleway-Bold"         }
    [PSCustomObject]@{ name = "Nunito";           key = "Nunito";           r400 = "Nunito-Regular";          r700 = "Nunito-Bold"          }
    [PSCustomObject]@{ name = "Oswald";           key = "Oswald";           r400 = "Oswald-Regular";          r700 = "Oswald-Bold"          }
    [PSCustomObject]@{ name = "Source Sans Pro";  key = "Source_Sans_Pro";  r400 = "SourceSans3-Regular";     r700 = "SourceSans3-Bold"     }
    [PSCustomObject]@{ name = "Ubuntu";           key = "Ubuntu";           r400 = "Ubuntu-Regular";          r700 = "Ubuntu-Bold"          }
    [PSCustomObject]@{ name = "Rubik";            key = "Rubik";            r400 = "Rubik-Regular";           r700 = "Rubik-Bold"           }
    [PSCustomObject]@{ name = "Work Sans";        key = "Work_Sans";        r400 = "WorkSans-Regular";        r700 = "WorkSans-Bold"        }
    [PSCustomObject]@{ name = "Fira Sans";        key = "Fira_Sans";        r400 = "FiraSans-Regular";        r700 = "FiraSans-Bold"        }
)

$downloaded = 0
$cached     = 0
$failed     = 0
$failedList = @()

Write-Host ""
Write-Host "Fonts dir: $fontsDir" -ForegroundColor Cyan
Write-Host ("-" * 65) -ForegroundColor DarkGray

foreach ($font in $fonts) {
    Write-Host ""
    Write-Host "Font: $($font.name)" -ForegroundColor Yellow

    $dst400 = Join-Path $fontsDir "$($font.key)-400.ttf"
    $dst700 = Join-Path $fontsDir "$($font.key)-700.ttf"
    $has400 = (Test-Path $dst400) -and ((Get-Item $dst400).Length -gt 10000)
    $has700 = (Test-Path $dst700) -and ((Get-Item $dst700).Length -gt 10000)

    if ($has400 -and $has700) {
        Write-Host "  [CACHED] $($font.key)-400.ttf" -ForegroundColor Green
        Write-Host "  [CACHED] $($font.key)-700.ttf" -ForegroundColor Green
        $cached += 2
        continue
    }

    $encodedName = [Uri]::EscapeDataString($font.name)
    $zipUrl      = "https://fonts.google.com/download?family=$encodedName"
    $zipPath     = Join-Path $tempDir "$($font.key).zip"
    $extractDir  = Join-Path $tempDir $font.key

    try {
        Write-Host "  Downloading ZIP from fonts.google.com..." -ForegroundColor DarkGray

        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
        $wc.DownloadFile($zipUrl, $zipPath)

        if (-not (Test-Path $zipPath) -or (Get-Item $zipPath).Length -lt 1000) {
            throw "ZIP is empty or not downloaded"
        }

        if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
        New-Item -ItemType Directory -Force -Path $extractDir | Out-Null

        # Expand-Archive не справляется с нестандартными ZIP от Google Fonts.
        # Используем System.IO.Compression.ZipFile из .NET напрямую.
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        try {
            [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $extractDir)
        } catch {
            # Если стандартный ZIP тоже не справляется — пробуем shell COM-объект
            $shell = New-Object -ComObject Shell.Application
            $zip   = $shell.NameSpace($zipPath)
            $dest  = $shell.NameSpace($extractDir)
            $dest.CopyHere($zip.Items(), 4 + 16)
            Start-Sleep -Seconds 2
        }

        $allTtf = Get-ChildItem -Path $extractDir -Filter "*.ttf" -Recurse

        # Regular (400)
        if (-not $has400) {
            $src = $allTtf | Where-Object { $_.BaseName -eq $font.r400 } | Select-Object -First 1
            if (-not $src) {
                $src = $allTtf | Where-Object {
                    $_.BaseName -match "Regular" -and $_.BaseName -notmatch "Italic"
                } | Select-Object -First 1
            }
            if ($src) {
                Copy-Item $src.FullName -Destination $dst400
                $sizeKb = [math]::Round((Get-Item $dst400).Length / 1024)
                Write-Host "  [OK] $($font.key)-400.ttf ($sizeKb KB)" -ForegroundColor Green
                $downloaded++
            } else {
                Write-Host "  [FAIL] Regular TTF not found in ZIP" -ForegroundColor Red
                Write-Host "  Available files: $($allTtf.BaseName -join ', ')" -ForegroundColor DarkRed
                $failed++
                $failedList += "$($font.key)-400"
            }
        } else {
            Write-Host "  [CACHED] $($font.key)-400.ttf" -ForegroundColor Green
            $cached++
        }

        # Bold (700)
        if (-not $has700) {
            $src = $allTtf | Where-Object { $_.BaseName -eq $font.r700 } | Select-Object -First 1
            if (-not $src) {
                $src = $allTtf | Where-Object {
                    $_.BaseName -match "Bold" -and $_.BaseName -notmatch "Italic"
                } | Select-Object -First 1
            }
            if ($src) {
                Copy-Item $src.FullName -Destination $dst700
                $sizeKb = [math]::Round((Get-Item $dst700).Length / 1024)
                Write-Host "  [OK] $($font.key)-700.ttf ($sizeKb KB)" -ForegroundColor Green
                $downloaded++
            } else {
                Write-Host "  [FAIL] Bold TTF not found in ZIP" -ForegroundColor Red
                $failed++
                $failedList += "$($font.key)-700"
            }
        } else {
            Write-Host "  [CACHED] $($font.key)-700.ttf" -ForegroundColor Green
            $cached++
        }

        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
        Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue

    } catch {
        Write-Host "  [ERROR] $_" -ForegroundColor Red
        if (-not $has400) { $failed++; $failedList += "$($font.key)-400" }
        if (-not $has700) { $failed++; $failedList += "$($font.key)-700" }
        Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
    }

    Start-Sleep -Milliseconds 400
}

Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host ("-" * 65) -ForegroundColor DarkGray
Write-Host "Downloaded: $downloaded" -ForegroundColor Green
if ($cached  -gt 0) { Write-Host "Cached:     $cached"   -ForegroundColor Cyan }
if ($failed  -gt 0) {
    Write-Host "Failed:     $failed" -ForegroundColor Red
    Write-Host "  $($failedList -join ', ')" -ForegroundColor DarkRed
    Write-Host ""
    Write-Host "NOTE: Failed fonts will use Lato/Poppins fallback in PDF generation." -ForegroundColor Yellow
} else {
    Write-Host "All fonts downloaded successfully!" -ForegroundColor Green
}
Write-Host ""
Write-Host "Done."
