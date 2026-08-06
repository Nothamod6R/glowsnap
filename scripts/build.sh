#!/usr/bin/env bash
#
# build.sh - Build production application.
#
# Compiles the React/TypeScript frontend and then builds the Go/Wails backend
# into build/bin/glowsnap. The frontend is built explicitly here so this works
# independently of the Wails frontend hooks; -clean ensures a fresh binary.
#
# This script intentionally does NOT run 'go mod tidy' so dependency state is
# never modified unexpectedly - use the exact dependencies already resolved in
# go.mod / go.sum.
#
# Usage:
#   ./scripts/build.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d "frontend" ]; then
    echo "ERROR: 'frontend' directory not found under $ROOT_DIR" >&2
    exit 1
fi
echo "Building React/TypeScript frontend..."
(cd frontend && npm run build)

if ! command -v wails >/dev/null 2>&1; then
    echo "ERROR: 'wails' CLI not found in PATH." >&2
    echo "Install it with: go install github.com/wailsapp/wails/v2/cmd/wails@latest" >&2
    exit 1
fi
echo "Building Wails application (WebKitGTK 4.1)..."
wails build -tags webkit2_41 -clean

APP_BIN="build/bin/glowsnap"
if [ ! -f "$APP_BIN" ]; then
    echo "ERROR: expected binary not found at $APP_BIN" >&2
    exit 1
fi
echo "Build successful. Binary: $(pwd)/$APP_BIN"
