"""Draws the "Projects across India" map into src/map.svg.

One-off generator; run it again only to change the places or the frame:
    curl -L -o adm1.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_10m_admin_1_states_provinces.geojson
    python3 tools/make-map.py adm1.geojson
Boundaries: Natural Earth (public domain), naturalearthdata.com.
"""
import html, json, math, sys, pathlib

# frame: Gujarat to Assam, Kanyakumari to just north of Delhi. The frame stops short of the
# northern frontier on purpose: Natural Earth draws it de facto, which differs from India's official map.
LON0, LON1, LAT0, LAT1 = 68.0, 97.4, 7.6, 30.8
K = 24                                           # pixels per degree of latitude
CX = math.cos(math.radians(20))                  # equirectangular, true at 20°N
PAD = 12
W = round((LON1 - LON0) * CX * K) + 2 * PAD
H = round((LAT1 - LAT0) * K) + 2 * PAD

HQ = ("HYDERABAD", 17.385, 78.487)
HQ_LINK = ("/contact/", "Head office, Hyderabad: contact details")
# label side: 1 = right of the pin, -1 = left; each pin opens a project in that place
PLACES = [
    ("DELHI NCR", 28.61, 77.21, -1, "/projects/drdo-precast-housing-ncr/", "DRDO Precast Residential Housing, NCR"),
    ("PATNA", 25.56, 84.87, 1, "/projects/iit-patna-secondary-school/", "IIT Patna Secondary School, Bihta"),
    ("NUMALIGARH", 26.62, 93.73, -1, "/projects/nursing-school-numaligarh/", "Nursing School cum Hostel Block, Numaligarh, Assam"),
    ("RAIGARH", 21.90, 83.40, -1, "/projects/jindal-corporate-tower-raigarh/", "Corporate Tower, Jindal Steel & Power, Raigarh"),
    ("BHUBANESWAR", 20.30, 85.82, 1, "/projects/mla-quarters-bhubaneswar/", "MLA Quarters, Bhubaneswar"),
    ("VISAKHAPATNAM", 17.69, 83.22, 1, "/projects/aptidco-pmay-housing/", "APTIDCO PMAY Housing, Visakhapatnam and Vizianagaram"),
    ("VIJAYAWADA", 16.51, 80.65, 1, "/projects/apcpdcl-corporate-office-vijayawada/", "APCPDCL Corporate Office, Vijayawada"),
    ("CHENNAI", 13.08, 80.27, 1, "/projects/nlc-chennai-precast/", "2B+9 Storey Precast Structure for NLC, Chennai"),
    ("BENGALURU", 12.97, 77.59, -1, "/projects/bda-bangalore-concrete-wall/", "Bangalore Development Authority Housing"),
    ("GOA", 15.49, 73.83, -1, "/projects/goa-villas/", "Goa Villas"),
]
# states with METEY work; clicking one lists its projects
WORKED = {"Telangana": "telangana", "Andhra Pradesh": "andhra-pradesh", "Karnataka": "karnataka", "Goa": "goa", "Odisha": "odisha",
          "Assam": "assam", "Bihar": "bihar", "Uttar Pradesh": "uttar-pradesh", "Haryana": "haryana", "Chhattisgarh": "chhattisgarh",
          "Tamil Nadu": "tamil-nadu", "Delhi": "delhi"}


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
         f'<text class="sea-l" x="{xy(14.5, 68.9)[0]:.0f}" y="{xy(14.5, 68.9)[1]:.0f}">Arabian Sea</text>',
         f'<text class="sea-l" x="{xy(15.6, 85.4)[0]:.0f}" y="{xy(15.6, 85.4)[1]:.0f}">Bay of Bengal</text>']

    n = 0
    for name, lat, lon, side, href, label in PLACES:
        label = html.escape(label)
        x, y = xy(lat, lon)
        tx, anchor = (x + 13, "") if side > 0 else (x - 13, ' text-anchor="end"')
        s.append(f'<g style="--n:{n}"><line x1="{hx:.1f}" y1="{hy:.1f}" x2="{x:.1f}" y2="{y:.1f}" class="ln" pathLength="1"/>'
                 f'<a class="dest" href="{href}" aria-label="{label}"><title>{label}</title><circle cx="{x:.1f}" cy="{y:.1f}" r="11" class="halo"/><circle cx="{x:.1f}" cy="{y:.1f}" r="5" class="pin"/>'
                 f'<text x="{tx:.1f}" y="{y + 4:.1f}"{anchor}>{name}</text></a></g>')
        n += 1

    s.append(f'<a class="hq-link" href="{HQ_LINK[0]}" aria-label="{HQ_LINK[1]}"><title>{HQ_LINK[1]}</title>'
             f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="10" class="pulse"/><circle cx="{hx:.1f}" cy="{hy:.1f}" r="10" class="pulse p2"/>'
             f'<circle cx="{hx:.1f}" cy="{hy:.1f}" r="7" class="home"/>'
             f'<text x="{hx - 14:.1f}" y="{hy - 10:.1f}" text-anchor="end" class="hq">HYDERABAD</text>'
             f'<text x="{hx - 14:.1f}" y="{hy + 4:.1f}" text-anchor="end" class="sub">Head office</text></a>')

    places = ", ".join(p[0].title() for p in PLACES)
    svg = (f'<svg class="wm map" viewBox="0 0 {W} {H}" role="img" aria-label="Map of India marking where METEY has worked, '
           f'with lines from the head office in Hyderabad to {places}">'
           + "".join(s) + "</svg>")
    out = pathlib.Path(__file__).resolve().parent.parent / "src" / "map.svg"
    out.write_text(svg + "\n")
    print(f"wrote {out} ({len(svg) // 1024} KB, {W}x{H})")


if __name__ == "__main__":
    main(sys.argv[1])
