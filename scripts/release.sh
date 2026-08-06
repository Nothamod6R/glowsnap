#!/usr/bin/env bash
#
# release.sh - Prepare release.
#
# Builds the application, packages the AppImage, and collects all release
# artifacts into release/<version>/.
#
# Usage:
#   ./scripts/release.sh v1.0.0 stable
#   ./scripts/release.sh 1.2.0 beta
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

APP_NAME="glowsnap"
RELEASE_TYPE="${2:-stable}"

if [ $# -lt 1 ] || [ $# -gt 2 ]; then
    echo "Usage: $0 <VERSION> [RELEASE_TYPE]" >&2
    echo "  VERSION       e.g. v1.0.0 or 1.0.0" >&2
    echo "  RELEASE_TYPE  stable|alpha|beta|nightly (default: stable)" >&2
    exit 1
fi

VERSION="$1"
VERSION_NO_V="${VERSION#v}"

case "$RELEASE_TYPE" in
    stable|alpha|beta|nightly) ;;
    *)
        echo "ERROR: invalid RELEASE_TYPE '$RELEASE_TYPE' (expected stable|alpha|beta|nightly)" >&2
        exit 1
        ;;
esac

echo "==> Building GlowSnap release $VERSION ($RELEASE_TYPE)"

VERSION="$VERSION" RELEASE_TYPE="$RELEASE_TYPE" "$SCRIPT_DIR/build-appimage.sh"

RELEASE_DIR="release/$VERSION_NO_V"
rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

APPIMAGE_SRC="build/AppImage/Glowsnap-${VERSION_NO_V}-${RELEASE_TYPE}-x86_64.AppImage"
BINARY_SRC="build/bin/$APP_NAME"

APPIMAGE_NAME="GlowSnap-${VERSION_NO_V}-${RELEASE_TYPE}-x86_64.AppImage"
BINARY_NAME="${APP_NAME}-${VERSION_NO_V}-${RELEASE_TYPE}-linux-amd64"

cp "$APPIMAGE_SRC" "$RELEASE_DIR/$APPIMAGE_NAME"
cp "$BINARY_SRC" "$RELEASE_DIR/$BINARY_NAME"

(
    cd "$RELEASE_DIR"
    sha256sum "$APPIMAGE_NAME" "$BINARY_NAME" > SHA256SUMS
)

echo
echo "Release prepared locally in: $(pwd)/$RELEASE_DIR"
echo "Artifacts:"
echo "  $APPIMAGE_NAME"
echo "  $BINARY_NAME"
echo "  SHA256SUMS"
echo
