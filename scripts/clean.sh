#!/usr/bin/env bash
#
# clean.sh - Remove generated build artifacts and temporary files.
#
# Only removes generated/output content - never source files.
#
# Usage:
#   ./scripts/clean.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

remove() {
    local target="$1"
    if [ -e "$target" ]; then
        rm -rf "$target"
        echo "Removed: $target"
    fi
}

remove "build/bin"
remove "build/AppImage"
remove "frontend/dist"
remove "glowsnap.AppDir"
remove "squashfs-root"
remove "release"

rm -f ./Glowsnap-*.AppImage

echo "Clean complete."
