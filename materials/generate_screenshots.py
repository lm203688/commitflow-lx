#!/usr/bin/env python3
"""Generate 3 CommitFlow VS Code screenshot mockups (PNG) using Pillow."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = r"C:\Users\ThinkPad\.dsh\bot\workspace\build_B3\materials"
os.makedirs(OUT, exist_ok=True)

def rgb(c):
    c = c.lstrip('#')
    return tuple(int(c[i:i+2], 16) for i in (0, 2, 4))

def load_font(size):
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        return ImageFont.load_default()

FT = load_font(14)
FB = load_font(12)
FL = load_font(11)
FS = load_font(10)

W, H = 1366, 768

# ── Screenshot 1: Rule editor panel ───────────────────────────────────────────
img = Image.new("RGB", (W, H), rgb("#1e1e1e"))
d = ImageDraw.Draw(img)
d.rectangle([0, 0, W, 35], fill=rgb("#3c3c3c"))
d.text((12, 9), "CommitFlow — Split Rules", font=FT, fill=rgb("#cccccc"))
d.rectangle([0, 35, 48, H], fill=rgb("#252526"))
d.rectangle([10, 300, 38, 328], fill=rgb("#007acc"))

rules = [
    ("UI changes",  "directory", "src/ui",        "fix(ui): update components"),
    ("Tests",       "ext",       ".spec.ts",      "test: add unit tests"),
    ("Stylesheets", "regex",     "^.*\\.css$",    "style: format stylesheets"),
    ("Docs",        "directory", "docs",          "docs: update documentation"),
    ("Refactor",    "regex",     "^.*\\.ts$",     "refactor: improve code quality"),
]
for i, row in enumerate(rules):
    y = 55 + i * 52
    bg = rgb("#252526") if i % 2 == 0 else rgb("#1e1e1e")
    d.rectangle([50, y, W, y+50], fill=bg)
    d.rectangle([55, y+12, 70, y+28], fill=rgb("#007acc"))
    d.text((78, y+12), row[0], font=FB, fill=rgb("#cccccc"))
    d.text((360, y+12), row[1], font=FL, fill=rgb("#858585"))
    d.text((520, y+12), row[2], font=FL, fill=rgb("#ce9178"))
    d.text((900, y+12), row[3], font=FL, fill=rgb("#858585"))
    d.text((1180, y+12), "Edit / Delete", font=FL, fill=rgb("#007acc"))

d.rectangle([0, H-28, W, H], fill=rgb("#007acc"))
d.text((12, H-22), "Free plan  ·  3/5 rules used", font=FS, fill=rgb("#ffffff"))
img.save(os.path.join(OUT, "screenshot-01-rule-editor.png"), "PNG")
print("OK screenshot-01-rule-editor.png")

# ── Screenshot 2: Commit preview dialog ───────────────────────────────────────
img = Image.new("RGB", (W, H), rgb("#1e1e1e"))
d = ImageDraw.Draw(img)
dx, dy, dw, dh = 300, 150, 766, 500
d.rectangle([dx, dy, dx+dw, dy+dh], fill=rgb("#2d2d2d"), outline=rgb("#858585"))
d.text((dx+20, dy+14), "Preview: 3 commit groups detected", font=FB, fill=rgb("#cccccc"))

groups = [
    ("UI changes",   "fix(ui): update components",  ("src/ui/Button.tsx", "src/ui/Input.tsx")),
    ("Tests",        "test: add unit tests",         ("src/ui/Button.spec.ts", "src/ui/Input.spec.ts")),
    ("(Unmatched)",  "manual: misc fixes",           ("README.md", "package.json")),
]
for gi, (gname, gmsg, gfiles) in enumerate(groups):
    gy = dy + 50 + gi * 100
    d.rectangle([dx+12, gy, dx+dw-12, gy+90], fill=rgb("#1e1e1e"), outline=rgb("#3c3c3c"))
    d.text((dx+22, gy+8), f"{gname}  ({len(gfiles)} files)", font=FL, fill=rgb("#4ec9b0"))
    d.text((dx+22, gy+34), f'Message: {gmsg}', font=FS, fill=rgb("#cccccc"))
    d.text((dx+22, gy+60), ', '.join(gfiles), font=FS, fill=rgb("#858585"))

d.rectangle([dx+dw-120, dy+dh-50, dx+dw-20, dy+dh-10], fill=rgb("#007acc"))
d.text((dx+dw-110, dy+dh-44), "Execute", font=FL, fill=rgb("#ffffff"))
d.rectangle([dx+dw-240, dy+dh-50, dx+dw-130, dy+dh-10], fill=rgb("#3c3c3c"))
d.text((dx+dw-230, dy+dh-44), "Cancel", font=FL, fill=rgb("#cccccc"))
img.save(os.path.join(OUT, "screenshot-02-commit-preview.png"), "PNG")
print("OK screenshot-02-commit-preview.png")

# ── Screenshot 3: Batch result toast ──────────────────────────────────────────
img = Image.new("RGB", (W, H), rgb("#1e1e1e"))
d = ImageDraw.Draw(img)
tx, ty, tw, th = 380, H-230, 760, 190
d.rectangle([tx, ty, tx+tw, ty+th], fill=rgb("#2d2d2d"), outline=rgb("#4ec9b0"), width=2)
d.text((tx+20, ty+12), "\u2713  CommitFlow: batch complete (3/3 succeeded)", font=FB, fill=rgb("#4ec9b0"))
d.text((tx+20, ty+52), "  UI changes: fixed(ui): update components  abc1234", font=FL, fill=rgb("#cccccc"))
d.text((tx+20, ty+78), "  Tests: test: add unit tests                 def5678", font=FL, fill=rgb("#cccccc"))
d.text((tx+20, ty+104), "  (Unmatched): manual: misc fixes             ghi9abc", font=FL, fill=rgb("#cccccc"))
d.text((tx+20, ty+134), "  Total: 3 groups, 6 files committed. Push manually.", font=FS, fill=rgb("#858585"))
cx = tx + tw - 70
d.rectangle([cx, ty+12, cx+50, ty+52], fill=rgb("#3c3c3c"))
d.text((cx+18, ty+20), "\u2715", font=FL, fill=rgb("#858585"))
img.save(os.path.join(OUT, "screenshot-03-batch-result.png"), "PNG")
print("OK screenshot-03-batch-result.png")

# ── Icon ──────────────────────────────────────────────────────────────────────
ic = Image.new("RGB", (256, 256), rgb("#1e1e1e"))
idraw = ImageDraw.Draw(ic)
# Git-branch icon motif
idraw.ellipse([40, 40, 216, 216], fill=rgb("#007acc"), outline=rgb("#ffffff"), width=5)
idraw.arc([70, 70, 186, 186], 0, 270, fill=rgb("#ffffff"), width=6)
idraw.filled_circle = lambda xy, radius, fill: idraw.ellipse([xy[0]-radius, xy[1]-radius, xy[0]+radius, xy[1]+radius], fill=fill)
idraw.filled_circle((128, 128), 30, rgb("#1e1e1e"))
idraw.filled_circle((128, 128), 18, rgb("#007acc"))
ic.save(os.path.join(OUT, "..", "icon.png"), "PNG")
print("OK icon.png")

print("\nAll screenshots and icon generated.")
