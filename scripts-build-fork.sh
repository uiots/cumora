#!/usr/bin/env bash
# Build + install + launch the side-by-side "Cumora Fork" app.
#
# See docs/FORK_BUILD.md for the isolation design and the sign-in caveat.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

APP_NAME="Cumora Fork"
DEST="/Applications/${APP_NAME}.app"
OUT="release/mac-arm64/${APP_NAME}.app"

echo "==> Building renderer bundle"
npm run build

echo "==> Generating dev icon"
python3 scripts-make-fork-icon.py

echo "==> Packaging (unsigned, arm64)"
npx electron-builder --mac --dir --arm64

echo "==> Installing to ${DEST}"
rm -rf "$DEST"
cp -R "$OUT" "$DEST"

# Unsigned local build: clear the quarantine gate so the first launch works.
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true

echo "==> Launching"
open -a "$APP_NAME"

echo
echo "Done. Bundle id : $(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$DEST/Contents/Info.plist")"
echo "     scheme    : $(/usr/libexec/PlistBuddy -c 'Print :CFBundleURLTypes:0:CFBundleURLSchemes:0' "$DEST/Contents/Info.plist")"
echo "     profile   : ~/Library/Application Support/Cumora Fork"
echo "     API       : $(grep VITE_CUMORA_API_BASE .env.production 2>/dev/null || echo 'https://api.cumora.ai')"