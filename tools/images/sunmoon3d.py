"""Turn a flat face of the Sun/Moon token into the thick wooden disc seen in 3/4, like the Hot-Air Balloons.

    py -3.13 tools/images/sunmoon3d.py <Sun.webp|Moon.webp> <out.png>

The faces (`app/src/images/tokens/Sun.webp` and `Moon.webp`, opaque 200 × 200 squares) are printed on top of a wooden
cylinder. It is drawn in the projection of the balloons (balloon3d.py): the vertical axis of the world is the vertical of
the image, so the side of the disc hangs straight down under its face, and is shaded with the same light (from above,
slightly left). The result is cut out on a transparent background, without shadow: bake it with shadow.py --kind wood.
"""
import argparse

import numpy as np
from PIL import Image

THICKNESS = 0.3  # the visible side, in diameters of the face
LIGHT = np.array([-0.35, -0.94])  # as in balloon3d.py: in the plane of the image, y down, from above slightly left
SUPERSAMPLING = 4
# The side of the yellow wood, lit and in the shade: a yellow darkened towards orange, as on the rulebook renders
# (Jeton-Soleil.ai, Jeton-Lune.ai), not towards olive
SIDE_LIGHT = np.array([248, 200, 30])
SIDE_DARK = np.array([176, 108, 0])


def extrude(face):
    face = face.convert("RGB")
    d = face.width
    t = round(THICKNESS * d)
    s = SUPERSAMPLING
    big = np.array(face.resize((d * s, d * s), Image.LANCZOS)).astype(float)

    h, w = (d + t) * s, d * s
    yy, xx = np.mgrid[0:h, 0:w] + 0.5
    r = d * s / 2
    nx = (xx - r) / r
    in_face = (nx ** 2 + ((yy - r) / r) ** 2) <= 1
    # The side: under the lower half of the rim, down to the same rim lowered by the thickness
    lower = r + r * np.sqrt(np.clip(1 - nx ** 2, 0, 1))
    in_side = (np.abs(nx) <= 1) & (yy >= r) & (yy <= lower + t * s) & ~in_face

    canvas = np.zeros((h, w, 4))
    # The side faces outward, horizontally: lit by its normal, darker towards the table
    ny = np.sqrt(np.clip(1 - nx ** 2, 0, 1))
    lit = nx * LIGHT[0] + ny * LIGHT[1]
    far = np.clip((yy - lower) / (t * s), 0, 1)
    shade = np.clip(0.75 + 0.35 * lit - 0.25 * far, 0, 1)[in_side, None]
    canvas[in_side, :3] = SIDE_DARK + (SIDE_LIGHT - SIDE_DARK) * shade
    canvas[in_side, 3] = 255
    # The face on top, its edge slightly darkened like a rounded rim
    edge = np.clip((np.sqrt(nx ** 2 + ((yy - r) / r) ** 2) - 0.96) / 0.04, 0, 1)[..., None]
    canvas[:d * s][in_face[:d * s], :3] = (big * (1 - 0.18 * edge[:d * s]))[in_face[:d * s]]
    canvas[in_face, 3] = 255

    out = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8))
    return out.resize((w // s, h // s), Image.LANCZOS)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("face")
    parser.add_argument("out")
    args = parser.parse_args()
    result = extrude(Image.open(args.face))
    result.save(args.out)
    print(args.out, result.size)
