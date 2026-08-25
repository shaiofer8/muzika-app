# gen_android_icons.py -- build-time tool only (Pillow), not loaded at runtime.
# Generates all Android density variants (launcher/maskable/splash/notification)
# for the TWA wrapper, reusing the same glyph/palette as gen_icons.py.
from PIL import Image, ImageDraw
import os

C1 = (124, 58, 237)   # --accent-a
C2 = (236, 72, 153)   # --accent-b

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def gradient_bg(size, c1, c2):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        r, g, b = lerp(c1, c2, t)
        for x in range(size):
            px[x, y] = (r, g, b, 255)
    return img

def draw_note(draw, size, color):
    s = size / 512
    draw.ellipse([170*s, 300*s, 260*s, 380*s], fill=color)
    draw.rectangle([250*s, 120*s, 262*s, 340*s], fill=color)
    draw.polygon([(262*s, 120*s), (340*s, 160*s), (340*s, 220*s), (262*s, 190*s)], fill=color)

def launcher_icon(size):
    img = gradient_bg(size, C1, C2)
    draw = ImageDraw.Draw(img)
    draw_note(draw, size, (255, 255, 255, 255))
    return img

def maskable_icon(size):
    img = gradient_bg(size, C1, C2)
    pad = size * 0.1
    inner = Image.new("RGBA", (int(size - 2 * pad), int(size - 2 * pad)), (0, 0, 0, 0))
    inner_draw = ImageDraw.Draw(inner)
    draw_note(inner_draw, inner.size[0], (255, 255, 255, 255))
    img.paste(inner, (int(pad), int(pad)), inner)
    return img

def splash_icon(size):
    # centered glyph on a transparent canvas -- backgroundColor shows through
    # from the theme; splash.png only carries the glyph, at ~40% of canvas.
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glyph_size = int(size * 0.4)
    glyph = Image.new("RGBA", (glyph_size, glyph_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glyph)
    draw_note(draw, glyph_size, (124, 58, 237, 255))
    offset = (size - glyph_size) // 2
    img.paste(glyph, (offset, offset), glyph)
    return img

def notification_icon(size):
    # small monochrome (white) glyph on transparent -- Android tints it itself
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_note(draw, size, (255, 255, 255, 255))
    return img

DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
LAUNCHER_BASE = 48
SPLASH_BASE = 300
NOTIF_BASE = 24

res = "app/src/main/res"
for density, scale in DENSITIES.items():
    launcher_size = int(LAUNCHER_BASE * scale)
    splash_size = int(SPLASH_BASE * scale)
    notif_size = int(NOTIF_BASE * scale)

    mip_dir = f"{res}/mipmap-{density}"
    draw_dir = f"{res}/drawable-{density}"
    os.makedirs(mip_dir, exist_ok=True)
    os.makedirs(draw_dir, exist_ok=True)

    launcher_icon(launcher_size).save(f"{mip_dir}/ic_launcher.png")
    maskable_icon(launcher_size).save(f"{mip_dir}/ic_maskable.png")
    splash_icon(splash_size).save(f"{draw_dir}/splash.png")
    notification_icon(notif_size).save(f"{draw_dir}/ic_notification_icon.png")
    print(f"{density}: launcher={launcher_size} splash={splash_size} notif={notif_size}")

print("android icons written")
