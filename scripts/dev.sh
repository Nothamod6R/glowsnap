#!/usr/bin/env bash
#
# dev.sh - Start development environment.
#
# Runs the Wails development server, which starts Vite (hot reload) for the
# frontend and hot-reloads the Go backend.
#
# The -tags webkit2_41 flag links against WebKitGTK 4.1 (the same tag used by
# scripts/build.sh), which is required on modern Linux desktops.
#
# Usage:
#   ./scripts/dev.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v wails >/dev/null 2>&1; then
    echo "ERROR: 'wails' CLI not found in PATH." >&2
    echo "Install it with: go install github.com/wailsapp/wails/v2/cmd/wails@latest" >&2
    exit 1
fi

echo "Starting GlowSnap development environment (Ctrl+C to stop)..."
exec wails dev -tags webkit2_41
