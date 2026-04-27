Add-Type -AssemblyName System.Drawing

$sizes = @{
    'mipmap-mdpi'    = 48
    'mipmap-hdpi'    = 72
    'mipmap-xhdpi'   = 96
    'mipmap-xxhdpi'  = 144
    'mipmap-xxxhdpi' = 192
}

$sourceIcon = "C:\Users\rahul\.gemini\antigravity\brain\10a4bb69-02d1-4011-be53-487c7cb7ad0d\app_icon_512_1768976729936.png"
$androidRes = "c:\test antigravity\may-i-borrow\android\app\src\main\res"

# Load source image
Write-Host "Loading source icon..."
$sourceImg = [System.Drawing.Image]::FromFile($sourceIcon)

# Create icons for each density
foreach ($folder in $sizes.Keys) {
    $size = $sizes[$folder]
    $folderPath = Join-Path $androidRes $folder
    
    # Create folder if it doesn't exist
    if (-not (Test-Path $folderPath)) {
        New-Item -ItemType Directory -Path $folderPath -Force | Out-Null
    }
    
    Write-Host "Creating icons for $folder (${size}x${size})..."
    
    # Resize image
    $bitmap = New-Object System.Drawing.Bitmap($sourceImg, $size, $size)
    
    # Save as ic_launcher.png
    $outputPath = Join-Path $folderPath "ic_launcher.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "  Created ic_launcher.png"
    
    # Save as ic_launcher_foreground.png
    $outputPathFg = Join-Path $folderPath "ic_launcher_foreground.png"
    $bitmap.Save($outputPathFg, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "  Created ic_launcher_foreground.png"
    
    # Save as ic_launcher_round.png
    $outputPathRound = Join-Path $folderPath "ic_launcher_round.png"
    $bitmap.Save($outputPathRound, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "  Created ic_launcher_round.png"
    
    $bitmap.Dispose()
}

$sourceImg.Dispose()
Write-Host "`nAll icons created successfully!" -ForegroundColor Green
