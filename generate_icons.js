const fs = require('fs');
const path = require('path');

// For this script, we'll use PowerShell to resize images
const { execSync } = require('child_process');

const sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
};

const sourceIcon = String.raw`C:\Users\rahul\.gemini\antigravity\brain\10a4bb69-02d1-4011-be53-487c7cb7ad0d\app_icon_512_1768976729936.png`;
const androidRes = String.raw`c:\test antigravity\may-i-borrow\android\app\src\main\res`;

// PowerShell script to resize image
function resizeImage(source, output, width, height) {
    const psScript = `
        Add-Type -AssemblyName System.Drawing
        $img = [System.Drawing.Image]::FromFile('${source}')
        $bitmap = New-Object System.Drawing.Bitmap($img, ${width}, ${height})
        $bitmap.Save('${output}', [System.Drawing.Imaging.ImageFormat]::Png)
        $bitmap.Dispose()
        $img.Dispose()
    `;

    try {
        execSync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
        console.log(`Created ${output}`);
    } catch (error) {
        console.error(`Failed to create ${output}:`, error.message);
    }
}

// Create icons for each density
for (const [folder, size] of Object.entries(sizes)) {
    const folderPath = path.join(androidRes, folder);

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // Create ic_launcher.png
    resizeImage(sourceIcon, path.join(folderPath, 'ic_launcher.png'), size, size);

    // Create ic_launcher_foreground.png
    resizeImage(sourceIcon, path.join(folderPath, 'ic_launcher_foreground.png'), size, size);

    // Create ic_launcher_round.png
    resizeImage(sourceIcon, path.join(folderPath, 'ic_launcher_round.png'), size, size);
}

console.log('\nAll icons created successfully!');
