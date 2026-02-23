# Copy installed Windows fonts to server/assets/fonts/
# Run: powershell -ExecutionPolicy Bypass -File scripts\copy-system-fonts.ps1

$fontsDir = Join-Path $PSScriptRoot "..\server\assets\fonts"
$winFonts = "C:\Windows\Fonts"

New-Item -ItemType Directory -Force -Path $fontsDir | Out-Null

$fontMap = @(
    @{ key="Montserrat";       r400=@("Montserrat-Regular.ttf","montserrat-regular.ttf");                     r700=@("Montserrat-Bold.ttf","montserrat-bold.ttf") }
    @{ key="Roboto";           r400=@("Roboto-Regular.ttf","roboto-regular.ttf");                             r700=@("Roboto-Bold.ttf","roboto-bold.ttf") }
    @{ key="Inter";            r400=@("Inter-Regular.ttf","inter-regular.ttf","Inter18pt-Regular.ttf","Inter_18pt-Regular.ttf"); r700=@("Inter-Bold.ttf","inter-bold.ttf","Inter18pt-Bold.ttf") }
    @{ key="Open_Sans";        r400=@("OpenSans-Regular.ttf","opensans-regular.ttf","OpenSans[wdth,wght].ttf"); r700=@("OpenSans-Bold.ttf","opensans-bold.ttf") }
    @{ key="Lato";             r400=@("Lato-Regular.ttf","lato-regular.ttf");                                 r700=@("Lato-Bold.ttf","lato-bold.ttf") }
    @{ key="Poppins";          r400=@("Poppins-Regular.ttf","poppins-regular.ttf");                           r700=@("Poppins-Bold.ttf","poppins-bold.ttf") }
    @{ key="Playfair_Display"; r400=@("PlayfairDisplay-Regular.ttf","Playfair_Display-Regular.ttf");          r700=@("PlayfairDisplay-Bold.ttf","Playfair_Display-Bold.ttf") }
    @{ key="Lora";             r400=@("Lora-Regular.ttf","lora-regular.ttf");                                 r700=@("Lora-Bold.ttf","lora-bold.ttf") }
    @{ key="Merriweather";     r400=@("Merriweather-Regular.ttf","merriweather-regular.ttf");                 r700=@("Merriweather-Bold.ttf","merriweather-bold.ttf") }
    @{ key="PT_Sans";          r400=@("PTSans-Regular.ttf","ptsans-regular.ttf","PT_Sans-Regular.ttf");       r700=@("PTSans-Bold.ttf","ptsans-bold.ttf","PT_Sans-Bold.ttf") }
    @{ key="PT_Serif";         r400=@("PTSerif-Regular.ttf","ptserif-regular.ttf","PT_Serif-Regular.ttf");    r700=@("PTSerif-Bold.ttf","ptserif-bold.ttf","PT_Serif-Bold.ttf") }
    @{ key="Noto_Sans";        r400=@("NotoSans-Regular.ttf","notosans-regular.ttf","NotoSans[wdth,wght].ttf"); r700=@("NotoSans-Bold.ttf","notosans-bold.ttf") }
    @{ key="Raleway";          r400=@("Raleway-Regular.ttf","raleway-regular.ttf");                           r700=@("Raleway-Bold.ttf","raleway-bold.ttf") }
    @{ key="Nunito";           r400=@("Nunito-Regular.ttf","nunito-regular.ttf");                             r700=@("Nunito-Bold.ttf","nunito-bold.ttf") }
    @{ key="Oswald";           r400=@("Oswald-Regular.ttf","oswald-regular.ttf");                             r700=@("Oswald-Bold.ttf","oswald-bold.ttf") }
    @{ key="Source_Sans_Pro";  r400=@("SourceSans3-Regular.ttf","SourceSansPro-Regular.ttf");                 r700=@("SourceSans3-Bold.ttf","SourceSansPro-Bold.ttf") }
    @{ key="Ubuntu";           r400=@("Ubuntu-Regular.ttf","ubuntu-regular.ttf");                             r700=@("Ubuntu-Bold.ttf","ubuntu-bold.ttf") }
    @{ key="Rubik";            r400=@("Rubik-Regular.ttf","rubik-regular.ttf");                               r700=@("Rubik-Bold.ttf","rubik-bold.ttf") }
    @{ key="Work_Sans";        r400=@("WorkSans-Regular.ttf","worksans-regular.ttf","Work_Sans-Regular.ttf"); r700=@("WorkSans-Bold.ttf","worksans-bold.ttf","Work_Sans-Bold.ttf") }
    @{ key="Fira_Sans";        r400=@("FiraSans-Regular.ttf","firasans-regular.ttf","Fira_Sans-Regular.ttf"); r700=@("FiraSans-Bold.ttf","firasans-bold.ttf","Fira_Sans-Bold.ttf") }
)

$copied = 0
$cached = 0
$missed = 0
$missedList = @()

Write-Host ""
Write-Host "Source: $winFonts"
Write-Host "Target: $fontsDir"
Write-Host ("-" * 65)

function Find-WinFont($candidates) {
    foreach ($name in $candidates) {
        $p = Join-Path $winFonts $name
        if ((Test-Path $p) -and (Get-Item $p).Length -gt 10000) {
            return $p
        }
    }
    return $null
}

foreach ($font in $fontMap) {
    $displayName = $font.key.Replace("_", " ")
    Write-Host ""
    Write-Host "[$displayName]" -ForegroundColor Yellow

    foreach ($weight in @(400, 700)) {
        $dst = Join-Path $fontsDir "$($font.key)-$weight.ttf"

        if ((Test-Path $dst) -and (Get-Item $dst).Length -gt 10000) {
            Write-Host "  CACHED  $($font.key)-$weight.ttf" -ForegroundColor Cyan
            $cached++
            continue
        }

        $candidates = if ($weight -eq 400) { $font.r400 } else { $font.r700 }
        $src = Find-WinFont $candidates

        if ($src) {
            Copy-Item $src -Destination $dst
            $sizeKb = [math]::Round((Get-Item $dst).Length / 1024)
            $srcName = Split-Path $src -Leaf
            Write-Host "  OK      $($font.key)-$weight.ttf  <-  $srcName  ($sizeKb KB)" -ForegroundColor Green
            $copied++
        } else {
            Write-Host "  MISSING $($font.key)-$weight.ttf" -ForegroundColor Red
            $missed++
            $missedList += "$($font.key)-$weight"
        }
    }
}

Write-Host ""
Write-Host ("-" * 65)
Write-Host "Copied:  $copied" -ForegroundColor Green
if ($cached -gt 0) { Write-Host "Cached:  $cached" -ForegroundColor Cyan }
if ($missed -gt 0) {
    Write-Host "Missing: $missed" -ForegroundColor Red
    Write-Host ("  " + ($missedList -join ", ")) -ForegroundColor DarkRed
} else {
    Write-Host "All fonts found and copied!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Files in fonts dir:"
Get-ChildItem $fontsDir -Filter "*.ttf" | Sort-Object Name | ForEach-Object {
    Write-Host ("  {0,-35} {1,5} KB" -f $_.Name, [math]::Round($_.Length/1024))
}
Write-Host ""
Write-Host "Done."
