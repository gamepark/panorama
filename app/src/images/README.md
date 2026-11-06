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
| `pawns/` | `BalloonBlue`, `Red`, `Green`, `Yellow` (wood) | 2.2 × 2.63 cm, **provisional** |
| `tokens/` | `Sun`, `Moon`: front and back of the wooden token | 2 cm diameter, **opaque** |
| `tokens/` | `Sun3d`, `Moon3d`: the same token seen in 3/4, its side under its face | 2 cm diameter, 0.6 cm of side |

The balloon pawns use the **wood** shadow, which grows the canvas by **24 px** per side.
`Sun` and `Moon` are opaque 200 × 200 squares without shadow, their corners filled with the rim colour: they
are the flat faces, used as icons. On the table, the token is the thick wooden disc of the rulebook
(`Jeton-Soleil.ai`, `Jeton-Lune.ai`): `Sun3d` and `Moon3d` are made from `Sun` and `Moon` by
`py -3.13 tools/images/sunmoon3d.py <Sun.webp> <out.png>`, then `shadow.py --kind wood`. Its side hangs straight down
under its face, in the projection of the balloons. Front and back of one item, so turning the Sun into the Moon is a flip.
The wooden pieces are not on the punchboard. The balloons come from the flat art of their face,
`PAN_Toolbox+COMMON_*\COMMON\Panorama_balloon_<colour>.png`, put on a wooden pawn seen in 3/4 by
`tools/images/balloon3d.py`. The pawn has the shape of the ones rendered for the rulebook
(`PAN_Package_EN_*\PAN_Rules_EN_*\Links\Meeple3d-Montgolfierebleu.ai`, all 4 alike): a band of wood around the
balloon, standing on a cloud. That render is seen slightly from the side and its balloon is slimmer: its cloud is
straightened, then scaled with the height of the balloon. The face is painted in the main colour of the balloon
(`WOOD`), extruded towards the upper right, the side darker and shaded by the direction it faces. The 4 pawns share
one canvas, standing at the middle of its bottom. The Sun/Moon token comes from the rulebook links
(`Jeton-LuneSoleil_Flat.ai`, sun on the left half, moon on the right). The real size of the balloon pawns is unknown: 2.2 cm wide (depth included) is a guess until we see
the physical game.

## Recipe

The publisher's Panorama folder (on Romain's machine: `kDrive\Licences\Scorpion Masqué\Panorama`) holds
`PAN_Punchboard+Tiles_*` and `PAN_Package_EN_*`. Python needs PyMuPDF, Pillow, numpy and scipy (`py -3.13` on
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
