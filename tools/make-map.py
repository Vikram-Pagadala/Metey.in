"""Draws the "Major commissions" map of South India into src/map.svg.

One-off generator; run it again only to change the places or the frame:
    curl -L -o /tmp/adm1.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_1_states_provinces.geojson
    python3 tools/make-map.py /tmp/adm1.geojson
Boundaries: Natural Earth (public domain), naturalearthdata.com.
"""
import json, math, sys, pathlib

LON0, LON1, LAT0, LAT1 = 72.4, 87.9, 7.7, 22.5   # frame: Goa to Odisha, Kanyakumari to Odisha's north
K = 32                                           # pixels per degree of latitude
CX = math.cos(math.radians(15))                  # equirectangular, true at 15°N
PAD = 12
W = round((LON1 - LON0) * CX * K) + 2 * PAD
H = round((LAT1 - LAT0) * K) + 2 * PAD

HQ = ("HYDERABAD", 17.385, 78.487)
HQ_LINK = ("/contact/", "Head office, Hyderabad: contact details")
# label side: 1 = right of the pin, -1 = left; each pin opens the project it stands for
PLACES = [
    ("AMARAVATI", 16.513, 80.517, 1, "/projects/kethanakonda/", "Technology Demonstration Housing, Kethanakonda"),
    ("VISAKHAPATNAM", 17.687, 83.219, 1, "/projects/#register", "Visakhapatnam economic city, in the project register"),
    ("ODISHA", 20.296, 85.825, -1, "/projects/odisha/", "Insulated Wall Construction, Odisha"),
    ("BANGALORE", 12.972, 77.595, 1, "/projects/montessori/", "Montessori School, Bangalore"),
    ("GOA", 15.491, 73.828, 1, "/projects/goa-villas/", "Goa Villas"),
]
ASSAM = (26.6, 93.8)                             # off the map: shown as a line leaving the frame
ASSAM_LINK = ("/projects/nursing-school/", "Nursing School, Numaligarh Refinery, Assam")
# states with METEY work; clicking one lists its projects
WORKED = {"Telangana": "telangana", "Andhra Pradesh": "andhra-pradesh", "Karnataka": "karnataka", "Goa": "goa", "Odisha": "odisha"}


def xy(lat, lon):
    return (PAD + (lon - LON0) * CX * K, PAD + (LAT1 - lat) * K)


def simplify(pts, tol):
    """Douglas-Peucker on projected points."""
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]
    dx, dy = x2 - x1, y2 - y1
    norm = math.hypot(dx, dy) or 1e-9
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        d = abs(dy * pts[i][0] - dx * pts[i][1] + x2 * y1 - y2 * x1) / norm
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [pts[0], pts[-1]]
    return simplify(pts[: idx + 1], tol)[:-1] + simplify(pts[idx:], tol)


def ring_path(ring):
    raw = [xy(lat, lon) for lon, lat in ring]
    # a closed ring starts and ends on the same point, which defeats Douglas-Peucker; simplify each half
    mid = len(raw) // 2
    pts = simplify(raw[: mid + 1], 0.9)[:-1] + simplify(raw[mid:], 0.9)
    if len(pts) < 3:
        return ""
    return "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"


def in_frame(geom):
    for poly in geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]:
        for lon, lat in poly[0]:
            if LON0 - .2 < lon < LON1 + .2 and LAT0 - .2 < lat < LAT1 + .2:
                return True
    return False


def main(src):
    data = json.load(open(src))
    shapes, lanka = [], []
    for f in data["features"]:
        p, g = f["properties"], f["geometry"]
        if p.get("admin") not in ("India", "Sri Lanka") or not g or not in_frame(g):
            continue
        polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
        d = "".join(ring_path(poly[0]) for poly in polys)
        if not d:
            continue
        if p["admin"] == "Sri Lanka":
            lanka.append(d)  # drawn as one unlabelled shape for context
            continue
        if p["name"] in WORKED:
            shapes.append(f'<a href="/projects/?state={WORKED[p["name"]]}" aria-label="Projects in {p["name"]}">'
                          f'<path class="st on" d="{d}"><title>{p["name"]}: see projects</title></path></a>')
        else:
            shapes.append(f'<path class="st" d="{d}"/>')

    hx, hy = xy(HQ[1], HQ[2])
    s = [f'<defs><clipPath id="mapClip"><rect x="0" y="0" width="{W}" height="{H}"/></clipPath></defs>',
         f'<rect class="sea" x="0" y="0" width="{W}" height="{H}"/>',
         f'<g clip-path="url(#mapClip)"><path class="lk" d="{"".join(lanka)}"/>{"".join(shapes)}</g>',
         f'<text class="sea-l" x="{xy(13.5, 74.2)[0]:.0f}" y="{xy(13.5, 74.2)[1]:.0f}">Arabian Sea</text>',
         f'<text class="sea-l" x="{xy(15.2, 84.6)[0]:.0f}" y="{xy(15.2, 84.6)[1]:.0f}">Bay of Bengal</text>']

    n = 0
    for name, lat, lon, side, href, label in PLACES:
        x, y = xy(lat, lon)
        tx, anchor = (x + 13, "") if side > 0 else (x - 13, ' text-anchor="end"')
        s.append(f'<g style="--n:{n}"><line x1="{hx:.1f}" y1="{hy:.1f}" x2="{x:.1f}" y2="{y:.1f}" class="ln" pathLength="1"/>'
                 f'<a class="dest" href="{href}" aria-label="{label}"><title>{label}</title><circle cx="{x:.1f}" cy="{y:.1f}" r="11" class="halo"/><circle cx="{x:.1f}" cy="{y:.1f}" r="5" class="pin"/>'
                 f'<text x="{tx:.1f}" y="{y + 4:.1f}"{anchor}>{name}</text></a></g>')
        n += 1

    # Assam lies far to the north-east: run the line to the edge of the frame and label it there
    ax, ay = xy(*ASSAM)
    t = min((PAD - hy) / (ay - hy), (W - PAD - hx) / (ax - hx))
    ex, ey = hx + (ax - hx) * t, hy + (ay - hy) * t
    ang = math.degrees(math.atan2(ey - hy, ex - hx))
    s.append(f'<g style="--n:{n}"><line x1="{hx:.1f}" y1="{hy:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" class="ln off" pathLength="1"/>'
             f'<a class="dest" href="{ASSAM_LINK[0]}" aria-label="{ASSAM_LINK[1]}"><title>{ASSAM_LINK[1]}</title><path d="M0 0l-11 -5v10z" class="arrow" transform="translate({ex:.1f} {ey:.1f}) rotate({ang:.1f})"/>'
             f'<text x="{ex - 18:.1f}" y="{ey + 6:.1f}" text-anchor="end">ASSAM</text></a></g>')  # sits above the line

    s.append(f'<a class="hq-link" href="{HQ_LINK[0]}" aria-label="{HQ_LINK[1]}"><title>{HQ_LINK[1]}</title>'
             f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="10" class="pulse"/><circle cx="{hx:.1f}" cy="{hy:.1f}" r="10" class="pulse p2"/>'
             f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="7" class="home"/>'
             f'<text x="{hx - 14:.1f}" y="{hy - 10:.1f}" text-anchor="end" class="hq">HYDERABAD</text>'
             f'<text x="{hx - 14:.1f}" y="{hy + 4:.1f}" text-anchor="end" class="sub">Head office</text></a>')

    svg = (f'<svg class="wm map" viewBox="0 0 {W} {H}" role="img" aria-label="Map of South India marking where METEY has worked, '
           f'from the head office in Hyderabad: Amaravati, Visakhapatnam, Odisha, Bangalore and Goa, and Assam in the north-east">'
           + "".join(s) + "</svg>")
    out = pathlib.Path(__file__).resolve().parent.parent / "src" / "map.svg"
    out.write_text(svg + "\n")
    print(f"wrote {out} ({len(svg) // 1024} KB, {W}x{H})")


if __name__ == "__main__":
    main(sys.argv[1])
