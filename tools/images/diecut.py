"""Read the Diecut layer of an InDesign IDML file as bezier paths, in the coordinates of the exported PDF page.

Usage, to inspect a file: py -3.13 diecut.py <file.idml> [--pages]
  without --pages: the master spread (where the tiles keep their hidden Diecut layer)
  with --pages:    every spread, one per PDF page (the punchboard)
"""
import re
import sys
import xml.etree.ElementTree as ET
import zipfile


def matrix(s):
    return [float(v) for v in s.split()]


def multiply(m, n):
    """The transform that applies n, then m (IDML matrices are a b c d tx ty)."""
    a, b, c, d, e, f = n
    A, B, C, D, E, F = m
    return [A * a + C * b, B * a + D * b, A * c + C * d, B * c + D * d, A * e + C * f + E, B * e + D * f + F]


def apply(m, p):
    return (m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5])


def point(s):
    x, y = s.split()
    return (float(x), float(y))


def load(idml, layer_name="Diecut", master=True):
    """Paths of the layer as (tag, id, open, points), each point being (anchor, left handle, right handle).

    master=True returns the paths of the master spread; master=False returns one list per spread.
    """
    z = zipfile.ZipFile(idml)
    designmap = z.read("designmap.xml").decode("utf8")
    layer = re.search(r'<Layer Self="([^"]*)" Name="%s"' % layer_name, designmap).group(1)
    kind = "MasterSpread" if master else "Spread"
    spreads = []
    for name in re.findall(r'<idPkg:%s src="([^"]*)"' % kind, designmap):
        paths = []
        spreads.append(paths)
        spread = ET.fromstring(z.read(name)).find(kind)
        page = spread.find("Page")
        top, left, _, _ = [float(v) for v in page.get("GeometricBounds").split()]
        origin = apply(matrix(page.get("ItemTransform")), (left, top))  # page top-left, in spread coordinates

        def walk(element, m):
            for child in element:
                t = child.get("ItemTransform")
                cm = multiply(m, matrix(t)) if t else m
                geometry = child.find("Properties/PathGeometry")
                if geometry is not None and child.get("ItemLayer") == layer:
                    for path in geometry.findall("GeometryPathType"):
                        pts = [tuple(apply(cm, point(p.get(k))) for k in ("Anchor", "LeftDirection", "RightDirection"))
                               for p in path.find("PathPointArray").findall("PathPointType")]
                        pts = [tuple((x - origin[0], y - origin[1]) for x, y in trip) for trip in pts]
                        paths.append((child.tag, child.get("Self"), path.get("PathOpen") == "true", pts))
                walk(child, cm)

        walk(spread, [1, 0, 0, 1, 0, 0])
    return spreads[0] if master else spreads


def draw(shape, pts, closed=True):
    """Draw a path on a PyMuPDF Shape."""
    n = len(pts)
    for i in range(n if closed else n - 1):
        a, b = pts[i], pts[(i + 1) % n]
        shape.draw_bezier(a[0], a[2], b[1], b[0])


if __name__ == "__main__":
    pages = "--pages" in sys.argv
    result = load(sys.argv[1], master=not pages)
    for i, paths in enumerate(result if pages else [result]):
        print("page", i + 1 if pages else "master")
        for tag, sid, is_open, pts in paths:
            xs = [p[0][0] for p in pts]
            ys = [p[0][1] for p in pts]
            print("  %s %s %s, %d points, x %.1f..%.1f y %.1f..%.1f pt (%.1f x %.1f mm)" % (
                tag, sid, "open" if is_open else "closed", len(pts), min(xs), max(xs), min(ys), max(ys),
                (max(xs) - min(xs)) / 72 * 25.4, (max(ys) - min(ys)) / 72 * 25.4))
