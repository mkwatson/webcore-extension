#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required but not installed. Please install it first."
    echo "You can install it with: brew install imagemagick"
    exit 1
fi

# Create placeholder icons
echo "Generating placeholder icons..."

# Default icons (blue)
convert -size 16x16 xc:#4285F4 -fill white -gravity center -draw "text 0,0 'W'" src/icons/default-16.png
convert -size 32x32 xc:#4285F4 -fill white -gravity center -draw "text 0,0 'W'" src/icons/default-32.png
convert -size 48x48 xc:#4285F4 -fill white -gravity center -draw "text 0,0 'W'" src/icons/default-48.png
convert -size 128x128 xc:#4285F4 -fill white -gravity center -draw "text 0,0 'W'" src/icons/default-128.png

# Active icons (green)
convert -size 16x16 xc:#34A853 -fill white -gravity center -draw "text 0,0 'W'" src/icons/active-16.png
convert -size 32x32 xc:#34A853 -fill white -gravity center -draw "text 0,0 'W'" src/icons/active-32.png
convert -size 48x48 xc:#34A853 -fill white -gravity center -draw "text 0,0 'W'" src/icons/active-48.png
convert -size 128x128 xc:#34A853 -fill white -gravity center -draw "text 0,0 'W'" src/icons/active-128.png

echo "Icons generated successfully!" 