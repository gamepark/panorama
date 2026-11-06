"""Cut the Panorama pieces out of the publisher's print files.

Usage: py -3.13 tools/images/cut.py <publisher-dir> <out-dir>

<publisher-dir> is the Panorama folder received from Le Scorpion Masqué (it holds PAN_Punchboard+Tiles_* and
PAN_Package_EN_*). <out-dir> receives PNGs at 100 px per cm, laid out like app/src/images, ready for
shadow.py (see app/src/images/README.md). Sun and Moon are written as final opaque WebP: they need no shadow.

Shapes come from the Diecut layer of the IDML files (diecut.py): for the tiles it is hidden and absent from
the PDF; on the punchboard it is printed in magenta, so those masks are eroded by 2 px.
"""
import io
import os
import sys

import numpy as np
import pymupdf
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
import balloon3d  # noqa: E402
import diecut  # noqa: E402

DPI = 254  # 100 px per cm

# Punchboard pages 2 to 4, pieces sorted top to bottom then left to right
PUNCHBOARD = {
    1: ["objectives/MostAnimalsSameRiver", "objectives/LongestRiver", "objectives/MostSeparateRivers",
        "objectives/MostWaterfallsSameRiver", "objectives/FewestTiles", "objectives/MostZonesWithAnimal",
        "objectives/MostCrows", "objectives/FewestZones"],
    2: ["objectives/LargestSky", "objectives/MostTilesOneSide", "start-tiles/StartTileYellow", "start-tiles/StartTileBlue"],
    3: ["objectives/FewestClouds", "objectives/MostCloudsOneSide", "start-tiles/StartTileRed", "start-tiles/StartTileGreen"],
}
# Punchboard page 1, top to bottom: the art of the 2 and 3 player pieces is printed rotated
CENTREPIECES = [("centrepieces/Centrepiece4", 0), ("centrepieces/Centrepiece2", 90), ("centrepieces/Centrepiece3", 180)]
BALLOONS = ["Blue", "Red", "Green", "Yellow"]


def find(folder, prefix):
    """The single entry of folder whose name starts with prefix (the publisher dates its folder names)."""
    matches = [n for n in os.listdir(folder) if n.startswith(prefix) and not n.endswith(".zip")]
    if len(matches) != 1:
        sys.exit("Expected one entry starting with %r in %s, found %s" % (prefix, folder, matches))
    return os.path.join(folder, matches[0])


def bbox(pts):
    xs = [c[0] for p in pts for c in p]
    ys = [c[1] for p in pts for c in p]
    return pymupdf.Rect(min(xs), min(ys), max(xs), max(ys))


def pieces(paths):
    """Paths of a page, minus the outer frame of the sheet."""
    return [pts for _, _, _, pts in paths if bbox(pts).width < 200]


def save(im, out, name):
    a = np.array(im)
    a[a[..., 3] == 0, :3] = 255  # keep transparent pixels white: no dark halo when the image is scaled
    path = os.path.join(out, name + ".png")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(a).save(path)


def cut(page, pts, out, name, rotate=0, erode=0):
    clip = bbox(pts) + (-1, -1, 1, 1)
    pix = page.get_pixmap(dpi=DPI, clip=clip, alpha=False)
    rgb = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    mask_doc = pymupdf.open()
    mask_page = mask_doc.new_page(width=page.rect.width, height=page.rect.height)
    shape = mask_page.new_shape()
    diecut.draw(shape, pts)
    shape.finish(fill=(0, 0, 0), color=None, closePath=True)
    shape.commit()
    mpix = mask_page.get_pixmap(dpi=DPI, clip=clip, colorspace=pymupdf.csGRAY, alpha=False)
    alpha = Image.frombytes("L", (mpix.width, mpix.height), mpix.samples).point(lambda v: 255 - v).resize(rgb.size)
    if erode:
        alpha = alpha.filter(ImageFilter.MinFilter(2 * erode + 1))
    im = rgb.convert("RGBA")
    im.putalpha(alpha)
    im = im.crop(alpha.getbbox())
    if rotate:
        im = im.rotate(rotate, expand=True, resample=Image.BICUBIC)
    save(im, out, name)


def tiles(src, out):
    front = find(src, "PAN_Tiles_Front_")
    base = os.path.join(front, os.path.basename(front).replace(" Folder", ""))
    left, right = sorted(pieces(diecut.load(base + ".idml")), key=lambda p: bbox(p).x0)
    # The numbers printed on the backs are the tile ids. Backs are mirrored: front page n shows 2n on the left.
    for n, page in enumerate(pymupdf.open(base + ".pdf"), 1):
        cut(page, left, out, "tiles/Tile%d" % (2 * n))
        cut(page, right, out, "tiles/Tile%d" % (2 * n - 1))
    back = find(src, "PAN_Tiles_Back_")
    base = os.path.join(back, os.path.basename(back).replace(" Folder", ""))
    page = pymupdf.open(base + ".pdf")[0]
    for word in page.get_text("words"):  # the tile number
        page.add_redact_annot(pymupdf.Rect(word[:4]))
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
    cut(page, pieces(diecut.load(base + ".idml"))[0], out, "tiles/TileBack")


def punchboard(src, out):
    folder = find(src, "PAN_Punchboard_Front_")
    base = os.path.join(folder, os.path.basename(folder).replace(" Folder", ""))
    pdf = pymupdf.open(base + ".pdf")
    spreads = diecut.load(base + ".idml", master=False)
    for (name, rotate), pts in zip(CENTREPIECES, sorted(pieces(spreads[0]), key=lambda p: bbox(p).y0)):
        cut(pdf[0], pts, out, name, rotate=rotate, erode=2)
    for index, names in PUNCHBOARD.items():
        found = sorted(pieces(spreads[index]), key=lambda p: (round(bbox(p).y0), bbox(p).x0))
        assert len(found) == len(names), "page %d: %d pieces, %d names" % (index + 1, len(found), len(names))
        for name, pts in zip(names, found):
            # The objectives are printed a quarter turn clockwise
            cut(pdf[index], pts, out, name, rotate=90 if name.startswith("objectives/") else 0, erode=2)


def wooden_pieces(src, out):
    rules = find(find(src, "PAN_Package_EN_"), "PAN_Rules_EN_")
    links = os.path.join(rules, "Links")
    # The Hot-Air Balloons: the flat art of their face, on a wooden pawn shaped like the ones rendered for the rulebook
    # (all 4 alike: the blue one is the easiest to cut out)
    common = os.path.join(find(src, "PAN_Toolbox+COMMON_"), "COMMON")
    pawn = balloon3d.rulebook_pawn(os.path.join(links, "Meeple3d-Montgolfierebleu.ai"))
    for color in BALLOONS:
        art = Image.open(os.path.join(common, "Panorama_balloon_%s.png" % color.lower()))
        save(balloon3d.extrude(art, *pawn, balloon3d.WOOD[color.lower()]), out, "pawns/Balloon" + color)
    # Both faces of the Sun/Moon token side by side: sun on the left, moon on the right
    pix = pymupdf.open(os.path.join(links, "Jeton-LuneSoleil_Flat.ai"), filetype="pdf")[0].get_pixmap(dpi=600, alpha=True)
    flat = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")
    half = flat.width // 2
    for name, box in (("Sun", (0, 0, half, flat.height)), ("Moon", (half, 0, flat.width, flat.height))):
        face = flat.crop(box)
        face = face.crop(face.getchannel("A").getbbox()).resize((200, 200), Image.LANCZOS)
        # Opaque square for a RoundTokenDescription: fill the corners with the colour of the rim
        x = face.width // 2
        y = next(y for y in range(face.height) if face.getpixel((x, y))[3] >= 250)
        rim = face.getpixel((x, y))[:3]
        opaque = Image.alpha_composite(Image.new("RGBA", face.size, rim + (255,)), face).convert("RGB")
        os.makedirs(os.path.join(out, "tokens"), exist_ok=True)
        opaque.save(os.path.join(out, "tokens", name + ".webp"), lossless=True, method=6)


def icons(src, out):
    """The animals and flowers of the Distribution box of the rulebook (last page): images with their transparency."""
    rules = pymupdf.open(find(src, "PAN_Rules_FR_"))
    page = rules[-1]
    found = []
    for xref, smask, *_ in page.get_images(full=True):
        rect = page.get_image_rects(xref)[0]
        if smask and rect.width < 100:
            found.append((round(rect.y0 / 20), rect.x0, xref, smask))
    names = ["Bear", "Fox", "Sheep", "Crow", "MountainFlower", "ForestFlower", "HillsFlower", "FieldsFlower"]
    found = [f for f in sorted(found) if f[0] < 15]  # the 2 rows of the box, not the logo at the bottom
    assert len(found) == len(names), found
    os.makedirs(os.path.join(out, "icons"), exist_ok=True)
    for name, (_, _, xref, smask) in zip(names, found):
        pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.Pixmap(rules, xref))
        pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(rules, smask))
        im = Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)
        im = im.crop(im.getchannel("A").getbbox())
        im.thumbnail((120, 120), Image.LANCZOS)
        im.save(os.path.join(out, "icons", name + ".webp"), lossless=True, method=6)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = sys.argv[1], sys.argv[2]
    tiles(find(src, "PAN_Punchboard+Tiles_"), out)
    punchboard(find(src, "PAN_Punchboard+Tiles_"), out)
    wooden_pieces(src, out)
