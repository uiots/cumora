#!/usr/bin/env python3
"""Generate the "Cumora Fork" app icon (no network, PIL + iconutil).

Sibling of scripts-make-dev-icon.py (which produces the "Cumora Dev" variant
into build/icons/). This one writes build/icons-fork/ so the two fork
variants can be built from the same checkout without clobbering each other
or the upstream icon.

Design: keep the official cloud art readable, stamp a dark "FORK" pill in
the lower-right with a white ring so it survives small sizes. No global
tint — the fork runs against the official cloud, so it should read as
"Cumora, clearly labelled", not as a different product.
"""
import os
import subprocess
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "build", "icon.png")
OUT_DIR = os.path.join(ROOT, "build", "icons-fork")
OUT_ICNS = os.path.join(OUT_DIR, "icon.icns")
OUT_PNG = os.path.join(OUT_DIR, "icon.png")
ICONSET = os.path.join(OUT_DIR, "icon.iconset")

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
    draw = ImageDraw.Draw(img)

    # FORK badge: rounded pill, lower-right, white ring for contrast.
    pad = 72
    bw, bh = 520, 180
    x0, y0 = BASE - pad - bw, BASE - pad - bh
    x1, y1 = x0 + bw, y0 + bh
    r = 46
    draw.rounded_rectangle([x0 - 10, y0 - 10, x1 + 10, y1 + 10], radius=r + 8,
                           fill=(255, 255, 255, 255))
    draw.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=(15, 23, 42, 240))
    font = load_font(112)
    txt = "FORK"
    tb = draw.textbbox((0, 0), txt, font=font)
    tw, th = tb[2] - tb[0], tb[3] - tb[1]
    draw.text((x0 + (bw - tw) / 2 - tb[0], y0 + (bh - th) / 2 - tb[1]),
              txt, font=font, fill=(255, 255, 255, 255))

    os.makedirs(ICONSET, exist_ok=True)
    img.save(OUT_PNG)
    for s in (16, 32, 128, 256, 512):
        img.resize((s, s), Image.LANCZOS).save(os.path.join(ICONSET, f"icon_{s}x{s}.png"))
        img.resize((s * 2, s * 2), Image.LANCZOS).save(os.path.join(ICONSET, f"icon_{s}x{s}@2x.png"))
    subprocess.run(["iconutil", "-c", "icns", ICONSET, "-o", OUT_ICNS], check=True)
    print("wrote", OUT_ICNS)


if __name__ == "__main__":
    sys.exit(main())
