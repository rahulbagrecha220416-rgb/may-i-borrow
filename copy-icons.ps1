# Script to copy generated app icons to Android resource directories

$brainDir = "$env:USERPROFILE\.gemini\antigravity\brain\11ee695c-7276-4715-9472-034b7825d79d"
$androidRes = "android\app\src\main\res"

Write-Host "Copying app icons to Android resource directories..."

# Define icon mappings
$icons = @{
    "app_icon_mdpi_1768467337684.png" = @("mipmap-mdpi\ic_launcher.png", "mipmap-mdpi\ic_launcher_round.png", "mipmap-mdpi\ic_launcher_foreground.png")
    "app_icon_hdpi_1768467317595.png" = @("mipmap-hdpi\ic_launcher.png", "mipmap-hdpi\ic_launcher_round.png", "mipmap-hdpi\ic_launcher_foreground.png")
    "app_icon_xhdpi_1768467285999.png" = @("mipmap-xhdpi\ic_launcher.png", "mipmap-xhdpi\ic_launcher_round.png", "mipmap-xhdpi\ic_launcher_foreground.png")
    "app_icon_xxhdpi_1768467266161.png" = @("mipmap-xxhdpi\ic_launcher.png", "mipmap-xxhdpi\ic_launcher_round.png", "mipmap-xxhdpi\ic_launcher_foreground.png")
    "app_icon_xxxhdpi_1768467241172.png" = @("mipmap-xxxhdpi\ic_launcher.png", "mipmap-xxxhdpi\ic_launcher_round.png", "mipmap-xxxhdpi\ic_launcher_foreground.png")
}

# Copy icons
foreach ($source in $icons.Keys) {
    $sourcePath = Join-Path $brainDir $source
    if (Test-Path $sourcePath) {
        foreach ($target in $icons[$source]) {
            $targetPath = Join-Path $androidRes $target
            Copy-Item -Path $sourcePath -Destination $targetPath -Force
            Write-Host "Copied to $target"
        }
    } else {
        Write-Host "Warning: Source file not found: $source"
    }
}

Write-Host "Icon copying complete!"
