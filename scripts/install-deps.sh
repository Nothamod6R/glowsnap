#!/usr/bin/env bash
#
# install-deps.sh - Report / install the dependencies required to develop
# locally (Go, Wails, Node.js/npm, WebKitGTK, AppImage tooling).
#
# By default this script only detects the OS and PRINTS the required packages
# and install commands so you can copy/paste them - it installs NOTHING.
# Pass --install to actually run the distro-specific package manager command.
#
# Usage:
#   ./scripts/install-deps.sh            # print instructions only (default)
#   ./scripts/install-deps.sh --install  # run installer for the detected distro
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

INSTALL_MODE=0
if [ "${1:-}" = "--install" ]; then
    INSTALL_MODE=1
fi

OS="$(uname -s)"
DISTRO=""
if [ -r /etc/os-release ]; then
    . /etc/os-release
    DISTRO="${ID:-}"
fi

echo "Detected OS: $OS"
[ -n "$DISTRO" ] && echo "Detected distro: $DISTRO"
echo

APT_PACKAGES=(build-essential libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev libwayland-dev patchelf)
DNF_PACKAGES=(gcc-c++ pkgconf-pkg-config glib2-devel gtk3-devel webkit2gtk4.1-devel libappindicator-gtk3-devel librsvg2-devel wayland-devel patchelf)
PACMAN_PACKAGES=(base-devel gtk3 webkit2gtk-4.1 libappindicator-gtk3 librsvg wayland patchelf)

PKGS=()
INSTALL_CMD=""

case "$DISTRO" in
    ubuntu|debian)
        PKGS=("${APT_PACKAGES[@]}")
        INSTALL_CMD="sudo apt-get update && sudo apt-get install -y ${APT_PACKAGES[*]}"
        ;;
    fedora|rhel|centos|rocky|almalinux)
        PKGS=("${DNF_PACKAGES[@]}")
        INSTALL_CMD="sudo dnf install -y ${DNF_PACKAGES[*]}"
        ;;
    arch|manjaro)
        PKGS=("${PACMAN_PACKAGES[@]}")
        INSTALL_CMD="sudo pacman -S --needed ${PACMAN_PACKAGES[*]}"
        ;;
    *)
        echo "WARNING: distro '$DISTRO' is not recognized - showing generic instructions." >&2
        echo
        ;;
esac

if [ "${#PKGS[@]}" -gt 0 ]; then
    echo "Native system packages required for $DISTRO:"
    printf '  - %s\n' "${PKGS[@]}"
    printf '\nRun this to install them:\n\n  %s\n\n' "$INSTALL_CMD"
fi

cat <<'EOF'
Toolchain (install manually once):
  - Go            https://go.dev/dl/
  - Node.js + npm https://nodejs.org (or via nvm: https://github.com/nvm-sh/nvm)
  - Wails CLI     go install github.com/wailsapp/wails/v2/cmd/wails@latest

AppImage tooling:
  - appimagetool  downloaded automatically by scripts/build-appimage.sh
                  (the repo also ships appimagetool-x86_64.AppImage)

Verify the toolchain afterwards with:
  go version && node --version && npm --version && wails version
EOF

if [ "$INSTALL_MODE" -eq 1 ]; then
    if [ -z "$INSTALL_CMD" ]; then
        echo "ERROR: --install is not supported for distro '$DISTRO'." >&2
        echo "Please install the dependencies manually using the instructions above." >&2
        exit 1
    fi
    echo "==> Running: $INSTALL_CMD"
    echo "(you may be prompted for your sudo password)"
    eval "$INSTALL_CMD"
    echo
    echo "System dependencies installed. Next install the Go toolchain,"
    echo "Node.js/npm, and the Wails CLI - see the instructions above."
else
    echo
    echo "No changes were made (report-only mode)."
    echo "Re-run with --install to apply the command shown above."
fi
