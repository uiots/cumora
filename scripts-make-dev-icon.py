#!/usr/bin/env python3
"""Generate a distinct 'Cumora Dev' app icon (no network, PIL + iconutil).

The side-by-side fork must be visually distinguishable from /Applications/Cumora.app
at a glance (dock, cmd-tab, Finder). We take the official build/icon.png, darken
tint it, and stamp a 'DEV' badge, then emit a full .iconset -> .icns via macOS
`iconutil`.
"""
import os
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "build", "icon.png")
OUT_ICNS = os.path.join(ROOT, "build", "icons", "icon.icns")
ICONSET = os.path.join(ROOT, "build", "icons", "icon.iconset")

BASE = 1024

def load_font(size):
    for path in (
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSDisplay.ttf",
    ):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

def main():
    img = Image.open(SRC).convert("RGBA").resize((BASE, BASE), Image.LANCZOS)

    # Cool tint so the fork never reads as the official warm Cumora icon.
    overlay = Image.new("RGBA", (BASE, BASE), (30, 60, 140, 96))
    img = Image.alpha_composite(img, overlay)

    # DEV badge: rounded pill in the lower-right.
    draw = ImageDraw.Draw(img)
    pad = 96
    bw, bh = 460, 190
    x0, y0 = BASE - pad - bw, BASE - pad - bh
    x1, y1 = x0 + bw, y0 + bh
    r = 48
    draw.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=(15, 23, 42, 235))
    font = load_font(120)
    txt = "DEV"
    tb = draw.textbbox((0, 0), txt, font=font)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    draw.text(
        (x0 + (bw - tw) / 2 - tb[0], y0 + (bh - th) / 2 - tb[1]),
        txt,
        font=font,
        fill=(255, 255, 255, 255),
    )

    # iconset -> icns
    os.makedirs(ICONSET, exist_ok=True)
    sizes = [16, 32, 128, 256, 512]
    for s in sizes:
        img.resize((s, s), Image.LANCZOS).save(os.path.join(ICONSET, f"icon_{s}x{s}.png"))
        img.resize((s * 2, s * 2), Image.LANCZOS).save(os.path.join(ICONSET, f"icon_{s}x{s}@2x.png"))
    subprocess.run(["iconutil", "-c", "icns", ICONSET, "-o", OUT_ICNS], check=True)
    print("wrote", OUT_ICNS)

if __name__ == "__main__":
    sys.exit(main())