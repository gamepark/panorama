"""Read where the animals and flowers are drawn on each tile, for the display of the scoring Zones of terrain.

Usage: py -3.13 tools/images/tile_icons.py <publisher-dir> <out.ts>

The positions come from the same IDML files as tiles_content.py: PAN_Tiles_Front_*.idml for the 36 Panorama Tiles, and
PAN_Punchboard_Front_*.idml for the Starting Tiles (all 4 drawn alike, the first one is read). Each icon is written as a
disc around its image, in cm from the middle of the tile (y is downwards), so that the score of a Zone can be drawn
away from them.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import diecut  # noqa: E402
from cut import find  # noqa: E402
from tiles_content import ANIMALS, DIES, FLOWERS, bbox, items  # noqa: E402

CM_PER_PT = 2.54 / 72
TILE = (85.2, 271.5)  # die of a Panorama Tile, pt
STARTING_TILE_PAGE = 2  # punchboard spread holding 2 Starting Tiles


def icons(found, x0, y0, width, height):
    """The animals and flowers whose image stands on the die whose top left corner is (x0, y0)"""
    result = []
    for layer, link, pts in found:
        if link not in ANIMALS and link not in FLOWERS:
            continue
        bx0, by0, bx1, by1 = bbox(pts)
        cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
        if not (x0 <= cx <= x0 + width and y0 <= cy <= y0 + height):
            continue
        result.append(dict(
            x=round((cx - x0 - width / 2) * CM_PER_PT, 2),
            y=round((cy - y0 - height / 2) * CM_PER_PT, 2),
            r=round(max(bx1 - bx0, by1 - by0) / 2 * CM_PER_PT, 2)
        ))
    return sorted(result, key=lambda icon: (icon['y'], icon['x']))


def ts_icons(icons):
    return '[' + ', '.join('{ x: %s, y: %s, r: %s }' % (i['x'], i['y'], i['r']) for i in icons) + ']'


def idml_of(folder):
    return os.path.join(folder, [f for f in os.listdir(folder) if f.endswith('.idml')][0])


def main(src, out):
    root = find(src, 'PAN_Punchboard+Tiles_')
    tiles = {}
    for index, found in enumerate(items(idml_of(find(root, 'PAN_Tiles_Front_')))):
        n = index + 1
        for side, number in (('left', 2 * n), ('right', 2 * n - 1)):
            tiles[number] = icons(found, *DIES[side], *TILE)
    punchboard = idml_of(find(root, 'PAN_Punchboard_Front_'))
    dies = [bbox([anchor for anchor, _, _ in path[3]]) for path in diecut.load(punchboard, master=False)[STARTING_TILE_PAGE]]
    die = min((d for d in dies if 300 < d[3] - d[1] < 400), key=lambda d: d[0])
    starting = icons(items(punchboard)[STARTING_TILE_PAGE], die[0], die[1], die[2] - die[0], die[3] - die[1])
    lines = [
        '/**',
        ' * Where the animals and flowers are drawn on each tile: discs in cm from the middle of the tile, y downwards.',
        ' * Read from the publisher\'s files by tools/images/tile_icons.py: do not edit by hand.',
        ' * Generated with: py -3.13 tools/images/tile_icons.py <publisher-dir> app/src/material/TileIcons.ts',
        ' */',
        'export type TileIcon = { x: number; y: number; r: number }',
        '',
        '/** The 36 Panorama Tiles, by number */',
        'export const panoramaTileIcons: Record<number, TileIcon[]> = {',
    ]
    lines += ['  %d: %s,' % (n, ts_icons(tiles[n])) for n in sorted(tiles)]
    lines[-1] = lines[-1].rstrip(',')
    lines += ['}', '', '/** The 4 Starting Tiles are drawn alike */', 'export const startingTileIcons: TileIcon[] = %s' % ts_icons(starting), '']
    with open(out, 'w', encoding='utf8', newline='\n') as f:
        f.write('\n'.join(lines))


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
