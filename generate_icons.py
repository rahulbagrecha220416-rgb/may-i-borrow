from PIL import Image
import os

# Icon sizes for different densities
sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
}

# Paths
source_icon = r'C:\Users\rahul\.gemini\antigravity\brain\10a4bb69-02d1-4011-be53-487c7cb7ad0d\app_icon_512_1768976729936.png'
android_res = r'c:\test antigravity\may-i-borrow\android\app\src\main\res'

# Open the source image
img = Image.open(source_icon)

# Create icons for each density
for folder, size in sizes.items():
    # Create folder if it doesn't exist
    folder_path = os.path.join(android_res, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    # Resize image
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    
    # Save as ic_launcher.png
    output_path = os.path.join(folder_path, 'ic_launcher.png')
    resized.save(output_path, 'PNG')
    print(f'Created {folder}/ic_launcher.png ({size}x{size})')
    
    # Also save as ic_launcher_foreground.png for adaptive icons
    output_path_fg = os.path.join(folder_path, 'ic_launcher_foreground.png')
    resized.save(output_path_fg, 'PNG')
    print(f'Created {folder}/ic_launcher_foreground.png ({size}x{size})')
    
    # Save as ic_launcher_round.png
    output_path_round = os.path.join(folder_path, 'ic_launcher_round.png')
    resized.save(output_path_round, 'PNG')
    print(f'Created {folder}/ic_launcher_round.png ({size}x{size})')

print('\nAll icons created successfully!')
