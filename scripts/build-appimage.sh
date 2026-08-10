#!/usr/bin/env bash
#
# build-appimage.sh - Package into a Linux AppImage.
#
# Builds the application (delegating to scripts/build.sh so the production
# build logic is defined only once) and then packages the resulting binary,
# icon and .desktop entry into an AppImage using appimagetool.
#
# Optional environment variables:
#   VERSION       Version string, e.g. "1.0.0" or "v1.0.0". When set, the
#                 output is named Glowsnap-<VERSION>-<TYPE>-x86_64.AppImage
#                 and the version is written into the generated .desktop file.
#   RELEASE_TYPE  Release channel: stable|alpha|beta|nightly (default: stable).
#
# Usage:
#   ./scripts/build-appimage.sh
#   VERSION=1.0.0 RELEASE_TYPE=stable ./scripts/build-appimage.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

APP_NAME="glowsnap"
BUILD_DIR="glowsnap.AppDir" 
OUTPUT_DIR="build/AppImage"
APPIMAGETOOL_URL="https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage"
APPIMAGETOOL="appimagetool-x86_64.AppImage"

VERSION="${VERSION:-}"
RELEASE_TYPE="${RELEASE_TYPE:-stable}"
case "$RELEASE_TYPE" in
    stable|alpha|beta|nightly) ;;
    *)
        echo "ERROR: invalid RELEASE_TYPE '$RELEASE_TYPE' (expected stable|alpha|beta|nightly)" >&2
        exit 1
        ;;
esac

if [ -n "$VERSION" ]; then
    VERSION="${VERSION#v}"
fi

VERSION="$VERSION" "$SCRIPT_DIR/build.sh"

echo "Creating AppDir folder structure..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/usr/bin"

echo "Copying binary executable and icon..."
cp "build/bin/$APP_NAME" "$BUILD_DIR/usr/bin/$APP_NAME"

if [ -f "build/appicon.png" ]; then
    cp "build/appicon.png" "$BUILD_DIR/$APP_NAME.png"
elif [ -f "build/appicon.svg" ]; then
    cp "build/appicon.svg" "$BUILD_DIR/$APP_NAME.png"
else
    echo "Warning: Application icon not found in build directory!" >&2
fi

echo "Creating AppRun script..."
cat << 'EOF' > "$BUILD_DIR/AppRun"
#!/bin/sh
SELF=$(readlink -f "$0")
HERE=${SELF%/*}
EXEC="${HERE}/usr/bin/glowsnap"
exec "${EXEC}" "$@"
EOF
chmod +x "$BUILD_DIR/AppRun"

echo "Creating .desktop file..."
{
    echo "[Desktop Entry]"
    echo "Name=Glowsnap"
    if [ -n "$VERSION" ]; then
        echo "X-AppImage-Version=$VERSION"
    fi
    echo "Exec=$APP_NAME"
    echo "Icon=$APP_NAME"
    echo "Type=Application"
    echo "Categories=Utility;"
} > "$BUILD_DIR/$APP_NAME.desktop"

echo "Downloading appimagetool if not present..."
if [ ! -f "$APPIMAGETOOL" ]; then
    if ! command -v wget >/dev/null 2>&1; then
        echo "ERROR: 'wget' is required to download $APPIMAGETOOL" >&2
        exit 1
    fi
    wget -q "$APPIMAGETOOL_URL"
    chmod +x "$APPIMAGETOOL"
fi

echo "Packaging application into AppImage..."
APPIMAGE_EXTRACT_AND_RUN=1 "./$APPIMAGETOOL" "$BUILD_DIR"

if [ -n "$VERSION" ]; then
    PRODUCED="Glowsnap-${VERSION}-x86_64.AppImage"
    FINAL_NAME="Glowsnap-${VERSION}-${RELEASE_TYPE}-x86_64.AppImage"
else
    PRODUCED="Glowsnap-x86_64.AppImage"
    FINAL_NAME="Glowsnap-x86_64.AppImage"
fi

mkdir -p "$OUTPUT_DIR"
mv "$PRODUCED" "$OUTPUT_DIR/$FINAL_NAME"

echo "Cleaning up temporary AppDir directory..."
rm -rf "$BUILD_DIR"

echo "Build successful! AppImage saved in: $(pwd)/$OUTPUT_DIR/$FINAL_NAME"
