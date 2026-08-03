#!/bin/bash
# Exit immediately if a command exits with a non-zero status
# to run this file, write in the bash
# chmod +x build.sh
# ./build.sh
set -e
APP_NAME="glowsnap"
BUILD_DIR="glowsnap.AppDir"
OUTPUT_DIR="build/AppImage"

echo "Welcome to GlowSnap build..."
echo "Building Wails application with webkit2_41 tag..."
wails build -tags webkit2_41

echo "Creating AppDir folder structure..."
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR/usr/bin

echo "Copying binary executable and icon..."
cp build/bin/$APP_NAME $BUILD_DIR/usr/bin/$APP_NAME

if [ -f "build/appicon.png" ]; then
    cp build/appicon.png $BUILD_DIR/$APP_NAME.png
elif [ -f "build/appicon.svg" ]; then
    cp build/appicon.svg $BUILD_DIR/$APP_NAME.png
else
    echo "Warning: Application icon not found in build directory!"
fi

echo "Creating AppRun script..."
cat << 'EOF' > $BUILD_DIR/AppRun
#!/bin/sh
SELF=$(readlink -f "$0")
HERE=${SELF%/*}
EXEC="${HERE}/usr/bin/glowsnap"
exec "${EXEC}" "$@"
EOF
chmod +x $BUILD_DIR/AppRun
echo "Creating .desktop file..."
cat << EOF > $BUILD_DIR/$APP_NAME.desktop
[Desktop Entry]
Name=Glowsnap
Exec=$APP_NAME
Icon=$APP_NAME
Type=Application
Categories=Utility;
EOF

echo "Downloading appimagetool if not present..."
if [ ! -f "appimagetool-x86_64.AppImage" ]; then
    wget -q https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
    chmod +x appimagetool-x86_64.AppImage
fi

echo "Packaging application into AppImage..."
APPIMAGE_EXTRACT_AND_RUN=1 ./appimagetool-x86_64.AppImage $BUILD_DIR

echo "Moving AppImage to output directory..."
mkdir -p $OUTPUT_DIR
mv Glowsnap-x86_64.AppImage $OUTPUT_DIR/

echo "Cleaning up temporary AppDir directory..."
rm -rf $BUILD_DIR

echo "Build successful! The AppImage file is saved in: $OUTPUT_DIR/Glowsnap-x86_64.AppImage"
