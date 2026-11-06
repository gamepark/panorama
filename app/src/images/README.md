# Images

All images are lossless WebP at **100 px per cm**, cut out on a transparent background with a baked-in
**cardboard** shadow (`.claude/skills/game-park/scripts/shadow.py --kind cardboard`). The shadow grows
every canvas by **20 px (0.2 cm) on each side**: add 0.4 cm to the physical width and height declared in
`Material.ts`.

| Folder | Files | Physical size (cut) |
|--------|-------|---------------------|
| `tiles/` | `Tile1` … `Tile36`, `TileBack` | 3.01 × 9.58 cm |
| `start-tiles/` | `StartTileBlue`, `Red`, `Green`, `Yellow` | 2.98 × 11.14 cm |
| `centrepieces/` | `Centrepiece2` (hexagon), `3` (heptagon), `4` (octagon) | ~6.3 cm across |
| `objectives/` | one file per objective, named after it | 3.64 × 3.79 cm |
| `pawns/` | `BalloonBlue`, `Red`, `Green`, `Yellow` (wood) | 2.2 × 2.58 cm, **provisional** |
| `tokens/` | `Sun`, `Moon`: front and back of the wooden token | 2 cm diameter, **opaque** |

The balloon pawns use the **wood** shadow, which grows the canvas by **24 px** per side.
`Sun` and `Moon` are opaque 200 × 200 squares without shadow, their corners filled with the rim colour: they
are meant for a `RoundTokenDescription` (`diameter = 2`), whose border radius clips the disc and whose CSS
shadow follows it. Front and back of one item, so turning the Sun into the Moon is a flip.
The wooden pieces are not on the punchboard: they come from the rulebook links
(`PAN_Package_EN_*\PAN_Rules_EN_*\Links`), `Meeple3d-Montgolfiere*.ai` and `Jeton-LuneSoleil_Flat.ai` (sun
on the left half, moon on the right). The cream cloud at the foot of the balloon art is painted in the colour
of the wood (`paint_cloud`), as on the pawns photographed in the rulebook. The real size of the balloon pawns is unknown: 2.2 cm wide is a guess
until we see the physical game.

## Recipe

The publisher's Panorama folder (on Romain's machine: `kDrive\Licences\Scorpion Masqué\Panorama`) holds
`PAN_Punchboard+Tiles_*` and `PAN_Package_EN_*`. Python needs PyMuPDF, Pillow and numpy (`py -3.13` on
Romain's machine).

1. `py -3.13 tools/images/cut.py <publisher-dir> <out-dir>` writes every piece as a PNG, already named and
   laid out like this folder. It renders the print PDFs at 254 dpi and cuts each piece along the **Diecut
   layer of the matching IDML** (`tools/images/diecut.py`): for the tiles this layer is hidden and absent
   from the PDF; on the punchboard it is printed in magenta, so those masks are eroded by 2 px. `Sun` and
   `Moon` come out as final WebP.
2. Bake the shadow of each PNG with `.claude/skills/game-park/scripts/shadow.py <piece>.png <dest>.webp`:
   - `tiles/`: `--kind cardboard`
   - `start-tiles/`, `centrepieces/`, `objectives/`: `--kind cardboard --defringe`
   - `pawns/`: `--kind wood`

Run on the files of June–October 2026, this recipe reproduces the delivered images pixel for pixel.

- **Tile numbers** are the ones printed on the back (01–36). On front page *n* of the PDF, the left tile is
  number 2*n* and the right one 2*n*−1, because the backs are mirrored. `TileBack` is rendered without its
  number.
- **Centrepieces** are printed rotated on the punchboard (2 players by 90°, 3 players by 180°). They are
  delivered upright, with the player count readable and the sunrise icon at the top.
- **Objectives** are printed a quarter turn clockwise on the punchboard: they are delivered upright, the
  polaroid's white band at the bottom.
- **Tile contents** (`rules/src/material/TileContents.ts`, for the scoring): `py -3.13 tools/images/tiles_content.py
  <publisher-dir> rules/src/material/TileContents.ts --check` reads the rows, rivers, animals, flowers and clouds of
  each tile from the tiles IDML, and the animals next to a river from the images of `tiles/` (so cut them first).
  `--check` compares the rows with the colours along the edges of the images. The Starting Tiles are described in the
  script: they are on the punchboard, and all 4 are drawn alike.
- **Cover** (`app/public/cover-1920.jpg` / `.webp`): the box illustration without logo,
  `PAN_Package_EN_*\PAN_Box_EN_*\Links\Visuel_Couv_03.png` (2953 × 4134), cropped to 16:9 from y = 1450 (full
  width, 1661 px high) and resized to 1920 × 1080; JPEG and WebP quality 85.
- Not delivered on purpose: the backs of the objectives, start tiles and centrepieces, which are never
  shown, and the score pad.
