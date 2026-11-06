"""Turn the flat art of a Hot-Air Balloon into a wooden pawn seen in 3/4, shaped like the pawns of the rulebook.

    py -3.13 tools/images/balloon3d.py <Panorama_balloon_xxx.png> <Meeple3d-Montgolfiere*.ai> <out.png>

The art (`Panorama_balloon_<colour>.png`, in `PAN_Toolbox+COMMON_*\\COMMON`) is printed on the face of the pawn. The
shape of the pawn is the one of the pawns rendered for the rulebook (`Meeple3d-Montgolfiere*.ai`, in its Links): a band
of wood around the balloon, standing on a cloud. Those renders are seen slightly from the side and their balloon is
slimmer, so only their cloud is taken, straightened and stretched to the new balloon. The face is painted in the
colour of the balloon, then extruded towards the upper right: the side is that colour darkened, shaded by the direction
it faces (lit from above). The result is cut out on a transparent background, without shadow: bake it with
shadow.py --kind wood.
"""
import argparse
import io

import numpy as np
import pymupdf
from PIL import Image
from scipy import ndimage

DEPTH = (0.26, -0.08)  # the back of the pawn, from its face, in widths of the face
LIGHT = np.array([-0.35, -0.94])  # in the plane of the image, y down: from above, slightly left
SIZE = (220, 263)  # the pawn in pixels, depth included, without its shadow: 2.2 cm wide (a guess)
# The colour of the wood of each pawn: the main colour of its balloon
WOOD = {"blue": (0, 116, 166), "red": (212, 100, 66), "green": (0, 132, 84), "yellow": (240, 194, 52)}


def rulebook_pawn(path):
    """The face of a pawn rendered for the rulebook, straightened: masks of the face and of its drawing."""
    pix = pymupdf.open(path, filetype="pdf")[0].get_pixmap(dpi=300, alpha=True)
    a = np.array(Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGBA")).astype(int)
    rgb, opaque = a[..., :3], a[..., 3] > 128
    # The face is painted in the colour of the wood (the most common one), a cream cloud and lighter colours; the side
    # is darker than 80 % of the wood
    colours, counts = np.unique(rgb[opaque] // 8, axis=0, return_counts=True)
    wood = colours[counts.argmax()] * 8 + 4
    light = opaque & (rgb.max(-1) >= 0.8 * wood.max())
    face = ndimage.binary_opening(ndimage.binary_fill_holes(ndimage.binary_closing(light, iterations=4)), iterations=2)
    drawing = face & opaque & (rgb.max(-1) < 60)
    # The bottom of the face is a straight line, sloping with the point of view: shear it back to the horizontal
    xs = np.arange(face.shape[1])
    columns = face.any(0)
    bottom = np.array([np.nonzero(face[:, x])[0].max() for x in xs[columns]])
    inner = slice(len(bottom) // 5, -len(bottom) // 5)
    slope = np.polyfit(xs[columns][inner], bottom[inner], 1)[0]
    shift = np.round(slope * xs).astype(int)
    pad = shift.max() + 1
    straight = lambda m: np.stack([np.roll(np.pad(m[:, x], (pad, pad)), -shift[x]) for x in xs], 1)
    return straight(face), straight(drawing)


def bbox(mask):
    ys, xs = np.nonzero(mask)
    return xs.min(), ys.min(), xs.max(), ys.max()


def face_shape(art_mask, old_face, old_drawing):
    """The face of the pawn: the balloon in its band of wood, standing on the cloud of the rulebook pawn.

    The balloon of the art is fatter than the one of the rulebook pawn, but as high: the band of wood and the cloud keep
    their size relative to the height of the balloon, and the cloud surrounds the basket as on the rulebook pawn."""
    ox0, oy0, ox1, oy1 = bbox(old_drawing)
    nx0, ny0, nx1, ny1 = bbox(art_mask)
    scale = (ny1 - ny0) / (oy1 - oy0)
    # The band of wood: from the outline of the balloon (not its basket, sunk in the cloud) to the edge of the face
    filled = ndimage.binary_fill_holes(ndimage.binary_closing(old_drawing, iterations=3))
    outline = filled & ~ndimage.binary_erosion(filled)
    outline[oy0 + (oy1 - oy0) * 3 // 4:] = False
    margin = np.median(ndimage.distance_transform_edt(old_face)[outline]) * scale
    # The top of the cloud: the highest point of the face out of the band of wood, in the lower quarter
    cloud = old_face & ~ndimage.binary_dilation(filled, iterations=int(margin / scale) + 6)
    cloud[:oy0 + (oy1 - oy0) * 3 // 4] = False
    cloud_top = bbox(cloud)[1]

    # From the art to the rulebook pawn: the middles of the bottoms of the drawings (under the baskets) match
    ocx, ncx = (ox0 + ox1) / 2, (nx0 + nx1) / 2
    old_x0, _, old_x1, old_y1 = bbox(old_face)
    # The canvas grows below the balloon to hold the cloud, and on both sides if the cloud is wider
    left = max(0, int(np.ceil((ocx - old_x0) * scale - ncx)) + 4)
    right = max(0, int(np.ceil(ncx + (old_x1 - ocx) * scale - art_mask.shape[1])) + 4)
    below = max(0, int(np.ceil(ny1 + (old_y1 - oy1) * scale - art_mask.shape[0])) + 4)
    h, w = art_mask.shape[0] + below, art_mask.shape[1] + left + right
    art = np.zeros((h, w), bool)
    art[:art_mask.shape[0], left:left + art_mask.shape[1]] = art_mask

    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    old_y = oy1 + (yy - ny1) / scale
    old_x = ocx + (xx - left - ncx) / scale
    cloud = ndimage.map_coordinates(old_face.astype(float), [old_y, old_x], order=1) > 0.5
    cloud &= old_y >= cloud_top

    band = ndimage.distance_transform_edt(~art) <= margin
    face = ndimage.gaussian_filter((band | cloud).astype(float), margin / 4) > 0.5
    return face, left


def extrude(art, old_face, old_drawing, wood, size=SIZE):
    a = np.array(art.convert("RGBA")).astype(float)
    art_alpha = a[..., 3] / 255
    art_mask = ndimage.binary_fill_holes(art_alpha > 0.5)
    mask, left = face_shape(art_mask, old_face, old_drawing)
    h, w = mask.shape
    wood = np.array(wood, float)

    # The face: the art printed on the wood
    face_rgb = np.zeros((h, w, 3)) + wood
    region = (slice(0, a.shape[0]), slice(left, left + a.shape[1]))
    alpha = art_alpha[..., None]
    face_rgb[region] = a[..., :3] * alpha + face_rgb[region] * (1 - alpha)

    ys, xs = np.nonzero(mask)
    face_width = xs.max() - xs.min()
    dx, dy = DEPTH[0] * face_width, DEPTH[1] * face_width
    steps = int(np.ceil(max(abs(dx), abs(dy))))
    margin = steps + 4
    H, W = h + 2 * margin, w + 2 * margin

    # Outward normal of the silhouette, from the gradient of the blurred mask
    soft = ndimage.gaussian_filter(mask.astype(float), 16)
    gy, gx = np.gradient(soft)
    norm = np.hypot(gx, gy) + 1e-9
    lit = np.clip(-gx / norm * LIGHT[0] - gy / norm * LIGHT[1], -1, 1)

    # Painter's algorithm, from the back of the pawn to its face: each layer only keeps how far it is (0 at the face,
    # 1 at the back) and where it comes from on the silhouette, which gives the direction the side faces.
    far = np.full((H, W), np.nan)
    source = np.zeros((H, W), dtype=np.int64)
    index = np.arange(h * w).reshape(h, w)
    for k in range(steps, 0, -1):
        ox, oy = margin + round(dx * k / steps), margin + round(dy * k / steps)
        far[oy:oy + h, ox:ox + w][mask] = k / steps
        source[oy:oy + h, ox:ox + w][mask] = index[mask]
    side = ~np.isnan(far)
    light = lit.ravel()[source[side]]
    shade = 0.46 + 0.24 * light - 0.08 * far[side]
    canvas = np.zeros((H, W, 4))
    canvas[side, :3] = np.clip(wood * shade[:, None], 0, 255)
    canvas[side, 3] = 255

    # The face over the side, its edge anti-aliased
    face_alpha = np.clip(ndimage.gaussian_filter(mask.astype(float), 1.2) * 2 - 0.5, 0, 1)
    face = canvas[margin:margin + h, margin:margin + w]
    fa, ba = face_alpha[..., None], face[..., 3:] / 255
    oa = fa + ba * (1 - fa)
    face[..., :3] = (face_rgb * fa + face[..., :3] * ba * (1 - fa)) / np.maximum(oa, 1e-6)
    face[..., 3:] = oa * 255

    out = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8))
    out = out.crop(out.getchannel("A").getbbox())
    # The 4 arts are not quite of the same proportions, but the pawns share one size: each one fits in it, standing at
    # the middle of its bottom
    fit = min(size[0] / out.width, size[1] / out.height)
    out = out.resize((round(out.width * fit), round(out.height * fit)), Image.LANCZOS)
    pawn = Image.new("RGBA", size)
    pawn.paste(out, ((size[0] - out.width) // 2, size[1] - out.height))
    return pawn


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("art")
    parser.add_argument("rulebook_pawn")
    parser.add_argument("out")
    args = parser.parse_args()
    colour = next(c for c in WOOD if c in args.art.lower())
    result = extrude(Image.open(args.art), *rulebook_pawn(args.rulebook_pawn), WOOD[colour])
    result.save(args.out)
    print(args.out, result.size)
