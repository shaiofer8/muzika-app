# gen_icons.py -- build-time tool only (Pillow), not loaded at runtime.
# Generates PWA/TWA icons using the app's own palette (purple->pink->cyan
# glow, same tokens as style.css :root) with a simple music-note glyph.
from PIL import Image, ImageDraw

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def gradient_bg(size, c1, c2):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        r, g, b = lerp(c1, c2, t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img

def draw_note(draw, size, color):
    # simple eighth-note glyph, proportioned to the canvas
    s = size / 512
    # note head (filled ellipse)
    draw.ellipse([170*s, 300*s, 260*s, 380*s], fill=color)
    # stem
    draw.rectangle([250*s, 120*s, 262*s, 340*s], fill=color)
    # flag
    draw.polygon([(262*s, 120*s), (340*s, 160*s), (340*s, 220*s), (262*s, 190*s)], fill=color)

def make_icon(path, size, maskable=False):
    c1 = (124, 58, 237)   # --accent-a
    c2 = (236, 72, 153)   # --accent-b
    img = gradient_bg(size, c1, c2)
    draw = ImageDraw.Draw(img)
    if maskable:
        # keep the glyph inside the ~80% safe zone maskable icons require
        pad = size * 0.1
        inner = Image.new("RGB", (int(size - 2 * pad), int(size - 2 * pad)))
        inner_draw = ImageDraw.Draw(inner)
        draw_note(inner_draw, inner.size[0], (255, 255, 255))
        img.paste(inner, (int(pad), int(pad)))
    else:
        draw_note(draw, size, (255, 255, 255))
    img.save(path, "PNG")

import os
os.makedirs("icons", exist_ok=True)
make_icon("icons/icon-192.png", 192)
make_icon("icons/icon-512.png", 512)
make_icon("icons/icon-maskable-192.png", 192, maskable=True)
make_icon("icons/icon-maskable-512.png", 512, maskable=True)
make_icon("favicon.png", 64)
print("icons written")
