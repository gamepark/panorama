"""Read what is drawn on each Panorama Tile from the publisher's files, and write it for the rules.

Usage: py -3.13 tools/images/tiles_content.py <publisher-dir> <out.ts> [--check]

The tiles are drawn in PAN_Tiles_Front_*.idml, one spread per front page and 2 tiles per spread (front page n: the left
tile is number 2n, the right one 2n-1, see app/src/images/README.md). Each tile is a stack of rows one wave high (44.18
pt, the period of the wavy edges): the sky, then one terrain image per row, from the mountains down to the fields.
- A "Cascade-A-B" row holds a waterfall: the river comes in at the top of the row on the left edge, and goes out at
  its bottom on the right edge. So its left edge shows the lower terrain B, and its right edge the upper terrain A.
- A "Rivière-*" drawing lays a river along the boundary between 2 rows.
- The animals, flowers and clouds are separate images; an animal is next to the river if its image touches the river
  (measured on the tile images of app/src/images/tiles).

--check also samples the colours along the edges of the tile images, and reports where they disagree with the rows.
"""
import colorsys
import os
import re
import sys
import unicodedata
import urllib.parse
import xml.etree.ElementTree as ET
import zipfile

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import diecut  # noqa: E402
from cut import find  # noqa: E402

ROW = 44.18  # pt, one wave
FIRST_ROW_TOP = 57.2  # pt, top of the image of the first terrain row (row 1, row 0 being the sky)
ROWS = 6
DIES = {'left': (30.4, 14.5), 'right': (145.6, 14.5)}  # top left corner of each tile on the page, pt
PX_PER_PT = 100 / (72 / 2.54)
SHADOW = 20  # px around the tile images
WAVE_PX = ROW * PX_PER_PT
NEXT_TO_RIVER = 10  # px between an animal image and the river

TERRAINS = [('Montagne', 'M'), ('Forêt', 'W'), ('Prairie', 'H'), ('Champs', 'F')]
ANIMALS = {'Ours': 'M', 'Renard': 'W', 'Mouton': 'H', 'Corbeau': 'F'}
FLOWERS = {'Edelweiss': 'M', 'Primevère': 'W', 'Coquelicot': 'H', 'Bleuet': 'F'}
NAMES = {'S': 'Sky', 'M': 'Mountain', 'W': 'Forest', 'H': 'Hills', 'F': 'Fields'}

# The Starting Tiles are on the punchboard, not in this file: all 4 are drawn alike (checked on their images). They are
# one wave taller at the top, so their rows start at -1.
STARTING_TILE = dict(top=-1, left='SSMWHHF', right='SSMWWHF', river=dict(left=3, right=4, waterfall=True, animals=0),
                     clouds=0, animals='', flowers='MWHF')


def terrain(link):
    for name, code in TERRAINS:
        if link.startswith(name):
            return code
    return None


def link_name(element):
    link = element.find('.//Link')
    if link is None:
        return None
    name = unicodedata.normalize('NFC', urllib.parse.unquote(link.get('LinkResourceURI', ''))).rsplit('/', 1)[-1]
    return name.rsplit('.', 1)[0]


def items(idml):
    """Per spread, the page items as (layer, link, points) with points in page coordinates, in drawing order."""
    z = zipfile.ZipFile(idml)
    designmap = z.read('designmap.xml').decode('utf8')
    layer_names = dict(re.findall(r'<Layer Self="([^"]*)" Name="([^"]*)"', designmap))
    result = []
    for name in re.findall(r'<idPkg:Spread src="([^"]*)"', designmap):
        spread = ET.fromstring(z.read(name)).find('Spread')
        page = spread.find('Page')
        top, left, _, _ = [float(v) for v in page.get('GeometricBounds').split()]
        origin = diecut.apply(diecut.matrix(page.get('ItemTransform')), (left, top))
        found = []

        def walk(element, m, layer):
            for child in element:
                t = child.get('ItemTransform')
                cm = diecut.multiply(m, diecut.matrix(t)) if t else m
                child_layer = layer_names.get(child.get('ItemLayer'), layer)
                geometry = child.find('Properties/PathGeometry')
                if geometry is not None and child.tag in ('Rectangle', 'Polygon'):
                    for path in geometry.findall('GeometryPathType'):
                        pts = [diecut.apply(cm, diecut.point(p.get('Anchor'))) for p in path.find('PathPointArray').findall('PathPointType')]
                        found.append((child_layer, link_name(child), [(x - origin[0], y - origin[1]) for x, y in pts]))
                if child.tag == 'Group':
                    walk(child, cm, child_layer)

        walk(spread, [1, 0, 0, 1, 0, 0], None)
        result.append(found)
    return result


def bbox(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def row_of(y):
    return round((y - FIRST_ROW_TOP) / ROW) + 1


def classify(rgb):
    r, g, b = [v / 255 for v in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    h *= 360
    if 190 <= h <= 205 and s > 0.8 and 0.64 <= l <= 0.78:
        return 'S'
    if 180 <= h <= 205 and s > 0.55 and 0.3 <= l < 0.64:
        return 'R'
    if 65 <= h <= 165 and s > 0.28 and l < 0.75:
        return 'H'
    if 36 <= h <= 64 and s > 0.55 and l > 0.42:
        return 'F'
    if (h < 36 or h > 330) and s > 0.3 and l < 0.75:
        return 'W'
    if s < 0.55 and 0.42 < l <= 0.88:
        return 'M'
    return None


def tile_content(found, side, image):
    """What one tile of a spread holds"""
    x0, y0 = DIES[side]
    mine = [(layer, link, pts) for layer, link, pts in found if ((bbox(pts)[0] + bbox(pts)[2]) / 2 < 130) == (side == 'left')]
    left, right = ['S'] * ROWS, ['S'] * ROWS
    river = None
    for layer, link, pts in mine:  # drawing order: a later row covers an earlier one
        if not layer.startswith('Paysages') or not link:
            continue
        top = bbox(pts)[1]
        if link.startswith('Rivière-'):
            # Drawn a little above the row it runs along the top of
            boundary = row_of(top + 4)
            river = dict(left=boundary, right=boundary, waterfall=False)
            continue
        row = row_of(top)
        if link.startswith('Cascade-'):
            upper, lower = [terrain(part) for part in link.split('-')[1:3]]
            left[row], right[row] = lower, upper
            river = dict(left=row, right=row + 1, waterfall=True)
        else:
            left[row] = right[row] = terrain(link)
    animals = sorted(ANIMALS[link] for layer, link, _ in mine if layer == 'Animaux et fleurs' and link in ANIMALS)
    flowers = sorted(FLOWERS[link] for layer, link, _ in mine if layer == 'Animaux et fleurs' and link in FLOWERS)
    clouds = sum(1 for layer, link, _ in mine if layer == 'Nuages' and link)
    if river:
        river['animals'] = animals_next_to_river(mine, image, x0, y0)
    return dict(top=0, left=''.join(left), right=''.join(right), river=river, clouds=clouds, animals=''.join(animals), flowers=''.join(flowers))


def animals_next_to_river(mine, image, x0, y0):
    small = image[::3, ::3]
    ys, xs = np.nonzero(np.array([[classify(px) == 'R' for px in row] for row in small]))
    river = np.stack([xs * 3, ys * 3], 1)
    count = 0
    for layer, link, pts in mine:
        if layer != 'Animaux et fleurs' or link not in ANIMALS:
            continue
        bx0, by0, bx1, by1 = bbox(pts)
        a = ((bx0 - x0) * PX_PER_PT + SHADOW, (by0 - y0) * PX_PER_PT + SHADOW)
        b = ((bx1 - x0) * PX_PER_PT + SHADOW, (by1 - y0) * PX_PER_PT + SHADOW)
        dx = np.maximum(np.maximum(a[0] - river[:, 0], 0), river[:, 0] - b[0])
        dy = np.maximum(np.maximum(a[1] - river[:, 1], 0), river[:, 1] - b[1])
        if len(river) and np.sqrt(dx * dx + dy * dy).min() <= NEXT_TO_RIVER:
            count += 1
    return count


def sampled_rows(image, side):
    """The majority colour of each row along an edge of a tile image, to check the rows read from the IDML"""
    h, w = image.shape[:2]
    x = SHADOW + 18 if side == 'left' else w - 1 - SHADOW - 18
    rows = []
    for r in range(ROWS):
        y_from = SHADOW + (0.6 if r == 0 else r + 0.3) * WAVE_PX
        y_to = SHADOW + (r + 1.2) * WAVE_PX
        votes = {}
        for y in range(int(y_from), int(y_to), 3):
            label = classify(image[y - 2:y + 3, x - 2:x + 3].reshape(-1, 3).mean(0))
            if label and label != 'R':
                votes[label] = votes.get(label, 0) + 1
        rows.append(max(votes, key=votes.get) if votes else '?')
    return ''.join(rows)


def ts_tile(content):
    def landscapes(codes):
        return '[' + ', '.join(codes) + ']'
    parts = ['top: %d' % content['top']] if content['top'] else []
    parts += ['left: %s' % landscapes(content['left']), 'right: %s' % landscapes(content['right'])]
    river = content['river']
    if river:
        parts.append('river: { left: %d, right: %d, waterfall: %s, animals: %d }' % (river['left'], river['right'], 'true' if river['waterfall'] else 'false', river['animals']))
    parts += ['clouds: %d' % content['clouds'], 'animals: %s' % landscapes(content['animals']), 'flowers: %s' % landscapes(content['flowers'])]
    return '{ ' + ', '.join(parts) + ' }'


def main(src, out, check):
    folder = find(find(src, 'PAN_Punchboard+Tiles_'), 'PAN_Tiles_Front_')
    idml = os.path.join(folder, os.path.basename(folder).replace(' Folder', '') + '.idml')
    tiles_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'app', 'src', 'images', 'tiles')
    contents = {}
    for index, found in enumerate(items(idml)):
        n = index + 1
        for side, number in (('left', 2 * n), ('right', 2 * n - 1)):
            image = np.array(Image.open(os.path.join(tiles_dir, 'Tile%d.webp' % number)).convert('RGB')).astype(float)
            contents[number] = tile_content(found, side, image)
            if check:
                for edge in ('left', 'right'):
                    sampled = sampled_rows(image, edge)
                    if sampled != contents[number][edge]:
                        print('Tile %d %s edge: rows %s, image %s' % (number, edge, contents[number][edge], sampled))
    lines = [
        '/**',
        ' * What is drawn on each tile, read from the publisher\'s files by tools/images/tiles_content.py: do not edit by hand.',
        ' * Generated with: py -3.13 tools/images/tiles_content.py <publisher-dir> rules/src/material/TileContents.ts',
        ' */',
        "import { Landscape } from './Landscape'",
        "import { TileContent } from './TileContent'",
        '',
        'const { %s } = Landscape' % ', '.join('%s: %s' % (NAMES[c], c) for c in 'SMWHF'),
        '',
        '/** The 36 Panorama Tiles, by number */',
        'export const panoramaTileContents: Record<number, TileContent> = {',
    ]
    lines += ['  %d: %s,' % (n, ts_tile(contents[n])) for n in sorted(contents)]
    lines[-1] = lines[-1].rstrip(',')
    lines += ['}', '', '/** The 4 Starting Tiles are drawn alike */', 'export const startingTileContent: TileContent = %s' % ts_tile(STARTING_TILE), '']
    with open(out, 'w', encoding='utf8', newline='\n') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 2:
        sys.exit(__doc__)
    main(args[0], args[1], '--check' in sys.argv)
