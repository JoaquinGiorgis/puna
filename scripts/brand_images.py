"""Genera la imagen OG/Twitter y los íconos de la web con la marca original de PUNA.

La marca es el SVG del header (web/public/brand/puna-mark.svg): path M1 21 L11 5 L17 13 L23 3 L33 21 Z,
trazo #0b2440 y punto #ea6a12. El fondo de la OG sale de un render de nano banana 2 (web/assets/og-source.jpg);
todo lo demás (logo, wordmark, textos) se dibuja acá, de forma determinista, con Geist (la tipografía de la web).

    .venv/bin/python scripts/brand_images.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"
FONTS = WEB / "node_modules/geist/dist/fonts/geist-sans"
INK, INK2, ORANGE = (11, 36, 64), (35, 62, 92), (234, 106, 18)
MARK = [(1, 21), (11, 5), (17, 13), (23, 3), (33, 21)]  # viewBox 0 0 34 22
SS = 4  # supersampling


def font(weight: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / f"Geist-{weight}.ttf"), size * SS)


def draw_mark(d: ImageDraw.ImageDraw, x: float, y: float, scale: float, stroke: float = 2.4, dot: float = 2.6, color=INK):
    """Dibuja el mark en coordenadas ya supersampleadas. scale = px por unidad del viewBox."""
    pts = [((x + px * scale) * SS, (y + py * scale) * SS) for px, py in MARK]
    w = round(stroke * scale * SS)
    d.line(pts + [pts[0], pts[1]], fill=color, width=w, joint="curve")
    cx, cy, r = (x + 23 * scale) * SS, (y + 3 * scale) * SS, dot * scale * SS
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ORANGE)


def text(d, xy, s, f, fill, tracking=0.0):
    """Texto con tracking (em) en coordenadas sin supersamplear; devuelve el ancho."""
    x, y = xy[0] * SS, xy[1] * SS
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill)
        x += f.getlength(ch) + tracking * f.size
    return x / SS - xy[0]


def measure(s, f, tracking=0.0):
    return sum(f.getlength(c) + tracking * f.size for c in s) / SS


def sky(w, h):
    """Degradé del cielo del render: claro arriba a la izquierda, más saturado a la derecha."""
    left, right = (197, 226, 255), (146, 203, 251)
    g = Image.new("RGB", (w, 1))
    for x in range(w):
        t = (x / (w - 1)) ** 1.15
        g.putpixel((x, 0), tuple(round(a + (b - a) * t) for a, b in zip(left, right)))
    g = g.resize((w, h))
    glow = Image.new("L", (w, h), 0)
    ImageDraw.Draw(glow).ellipse((-w * 0.25, -h * 0.6, w * 0.55, h * 0.7), fill=90)
    return Image.composite(Image.new("RGB", (w, h), (232, 244, 255)), g, glow.filter(ImageFilter.GaussianBlur(120)))


def feather(size, inset):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).rounded_rectangle((inset, inset, size[0] - inset, size[1] - inset), radius=inset * 2, fill=255)
    return m.filter(ImageFilter.GaussianBlur(inset * 0.6))


def og(path_out: Path):
    W, H = 1200, 630
    src = Image.open(WEB / "assets/og-source.jpg").convert("RGB")
    base = sky(W, H)

    # satélite + card de vidrio, a la derecha y dentro de la zona segura (60 px de margen lateral, 35 vertical)
    sat = src.crop((1440, 190, 2752, 1390))
    sh = 430
    sat = sat.resize((round(sat.width * sh / sat.height), sh), Image.LANCZOS)
    sx, sy = W - 60 - sat.width + 24, (H - sh) // 2 + 4
    base.paste(sat, (sx, sy), feather(sat.size, 34))


    hi = base.resize((W * SS, H * SS), Image.LANCZOS)
    d = ImageDraw.Draw(hi)
    X = 84
    # marca: mark + wordmark, como en el header
    draw_mark(d, X, 92, 2.6)
    text(d, (X + 34 * 2.6 + 22, 86), "PUNA", font("Bold", 50), INK, tracking=0.22)
    # título (≥ 64 px), claim corto y URL
    ft = font("Bold", 70)
    for i, line in enumerate(["Peritaje satelital", "para seguros agro"]):
        text(d, (X - 3, 196 + i * 78), line, ft, INK, tracking=-0.035)
    text(d, (X, 376), "Un satélite mide el daño, otro operador", font("Regular", 28), INK2)
    text(d, (X, 414), "lo audita y el seguro se paga solo.", font("Regular", 28), INK2)
    pill_f = font("SemiBold", 22)
    url = "puna-mission-control.vercel.app"
    pw = measure(url, pill_f) + 40
    d.rounded_rectangle((X * SS, 500 * SS, (X + pw) * SS, 544 * SS), radius=22 * SS, fill=(255, 255, 255, 235))
    text(d, (X + 20, 509), url, pill_f, INK)

    out = hi.resize((W, H), Image.LANCZOS)
    out.save(path_out, quality=86, optimize=True, progressive=True)
    return out


def tile(size: int, rounded: bool, mark_w: float, stroke: float) -> Image.Image:
    """Ícono: cuadrado celeste con el mark centrado."""
    S = size * SS
    g = Image.new("RGB", (1, 2))
    g.putpixel((0, 0), (226, 242, 255)); g.putpixel((0, 1), (170, 214, 250))
    im = g.resize((S, S), Image.BICUBIC).convert("RGBA")
    d = ImageDraw.Draw(im)
    scale = mark_w * size / 34
    x = (size - 34 * scale) / 2
    y = (size - 22 * scale) / 2 + 0.03 * size
    draw_mark(d, x, y, scale, stroke=stroke, dot=max(2.6, stroke * 1.25))
    if rounded:
        m = Image.new("L", (S, S), 0)
        ImageDraw.Draw(m).rounded_rectangle((0, 0, S - 1, S - 1), radius=round(S * 0.22), fill=255)
        im.putalpha(m)
    return im.resize((size, size), Image.LANCZOS)


def logo(path_out: Path):
    """Logo horizontal (mark + PUNA) con fondo transparente."""
    H = 160
    f = font("Bold", 96)
    tw = measure("PUNA", f, 0.22)
    W = int(34 * 4.4 + 36 + tw + 20)
    im = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    draw_mark(d, 6, 30, 4.4)
    text(d, (34 * 4.4 + 40, 18), "PUNA", f, INK, tracking=0.22)
    im = im.resize((W, H), Image.LANCZOS)
    im.crop(im.getbbox()).save(path_out, optimize=True)


if __name__ == "__main__":
    app, pub = WEB / "app", WEB / "public"
    img = og(app / "opengraph-image.jpg")
    img.save(app / "twitter-image.jpg", quality=86, optimize=True, progressive=True)
    tile(512, True, 0.70, 2.6).save(app / "icon.png", optimize=True)
    tile(180, False, 0.66, 2.6).save(app / "apple-icon.png", optimize=True)
    # favicon: trazo más grueso para que se lea a 16 px
    tile(256, True, 0.78, 3.4).save(app / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    tile(192, True, 0.70, 2.6).save(pub / "icons/icon-192.png", optimize=True)
    tile(512, True, 0.70, 2.6).save(pub / "icons/icon-512.png", optimize=True)
    tile(512, False, 0.56, 2.6).save(pub / "icons/icon-maskable-512.png", optimize=True)  # zona segura del 80 %
    logo(pub / "brand/puna-logo.png")
    for p in [app / "opengraph-image.jpg", app / "icon.png", app / "favicon.ico", pub / "brand/puna-logo.png"]:
        print(p.relative_to(ROOT), p.stat().st_size // 1024, "KB")
