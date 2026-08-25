"""Generate the Play Store Feature Graphic (1024x500).
Regenerate any time by running: python gen_feature_graphic.py

Matches the app's actual brand tokens (style.css :root) rather than
inventing new colors, and reuses the same note glyph as gen_icons.py.
"""
from PIL import Image, ImageDraw, ImageFont
from bidi.algorithm import get_display
import os

W, H = 1024, 500
OUT = os.path.join(os.path.dirname(__file__), "store_feature_graphic.png")

# style.css :root -- --accent-a / --accent-b
ACCENT_A = (124, 58, 237)   # violet
ACCENT_B = (236, 72, 153)   # pink

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REGULAR = "C:/Windows/Fonts/segoeui.ttf"


def diagonal_gradient(w, h, c1, c2):
    img = Image.new("RGB", (w, h), c1)
    px = img.load()
    max_d = w + h
    for y in range(h):
        for x in range(0, w, 2):
            t = (x + y) / max_d
            r = int(c1[0] + (c2[0] - c1[0]) * t)
            g = int(c1[1] + (c2[1] - c1[1]) * t)
            b = int(c1[2] + (c2[2] - c1[2]) * t)
            px[x, y] = (r, g, b)
            if x + 1 < w:
                px[x + 1, y] = (r, g, b)
    return img


def draw_note_glyph(draw, cx, cy, size, fg=(255, 255, 255)):
    """Same glyph as gen_icons.py's draw_note(), scaled for the banner."""
    s = size / 512
    left, top = cx - size / 2, cy - size / 2
    draw.ellipse([left + 170*s, top + 300*s, left + 260*s, top + 380*s], fill=fg)
    draw.rectangle([left + 250*s, top + 120*s, left + 262*s, top + 340*s], fill=fg)
    draw.polygon([
        (left + 262*s, top + 120*s), (left + 340*s, top + 160*s),
        (left + 340*s, top + 220*s), (left + 262*s, top + 190*s),
    ], fill=fg)


def main():
    img = diagonal_gradient(W, H, ACCENT_A, ACCENT_B)
    draw = ImageDraw.Draw(img)

    scrim = Image.new("RGBA", (W, H), (0, 0, 0, 60))
    img = Image.alpha_composite(img.convert("RGBA"), scrim).convert("RGB")
    draw = ImageDraw.Draw(img)

    draw_note_glyph(draw, cx=W - 190, cy=H / 2, size=280)

    name = get_display("מי מזהה את השיר?")
    tagline = get_display("משחק מסיבה - נחשו את השיר, אתגרו את החברים")

    text_right_edge = W - 360
    max_name_w = text_right_edge - 30  # leave a left margin

    name_size = 78
    font_name = ImageFont.truetype(FONT_BOLD, name_size)
    name_bbox = draw.textbbox((0, 0), name, font=font_name)
    name_w = name_bbox[2] - name_bbox[0]
    while name_w > max_name_w and name_size > 30:
        name_size -= 2
        font_name = ImageFont.truetype(FONT_BOLD, name_size)
        name_bbox = draw.textbbox((0, 0), name, font=font_name)
        name_w = name_bbox[2] - name_bbox[0]

    font_tag = ImageFont.truetype(FONT_REGULAR, 30)
    tag_bbox = draw.textbbox((0, 0), tagline, font=font_tag)
    tag_w = tag_bbox[2] - tag_bbox[0]
    tag_size = 30
    while tag_w > max_name_w and tag_size > 16:
        tag_size -= 2
        font_tag = ImageFont.truetype(FONT_REGULAR, tag_size)
        tag_bbox = draw.textbbox((0, 0), tagline, font=font_tag)
        tag_w = tag_bbox[2] - tag_bbox[0]

    name_x = text_right_edge - name_w
    name_y = H / 2 - 70

    draw.text((name_x + 3, name_y + 3), name, font=font_name, fill=(0, 0, 0, 90))
    draw.text((name_x, name_y), name, font=font_name, fill=(255, 255, 255))

    tag_x = text_right_edge - tag_w
    tag_y = name_y + 100
    draw.text((tag_x, tag_y), tagline, font=font_tag, fill=(255, 255, 255))

    img.save(OUT, "PNG")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
