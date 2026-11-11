import json, math
import numpy as np
from PIL import Image, ImageFilter

TEX = "/usr/local/lib/python3.13/dist-packages/mpl_toolkits/basemap_data/bmng.jpg"
S = 2                      # render scale
PW, PH = 820, 632          # panel size (1x)
W, H = PW * S, PH * S
LAT0, LON0 = -24.0, -59.0  # view center
CX, CY, R = 370 * S, 352 * S, 450 * S  # globe center/radius in pixels (2x)

tex = np.asarray(Image.open(TEX).convert("RGB")).astype(np.float32) / 255.0
TH, TW, _ = tex.shape

la0, lo0 = math.radians(LAT0), math.radians(LON0)
f = np.array([math.cos(la0) * math.cos(lo0), math.cos(la0) * math.sin(lo0), math.sin(la0)])
e = np.array([-math.sin(lo0), math.cos(lo0), 0.0])
n = np.array([-math.sin(la0) * math.cos(lo0), -math.sin(la0) * math.sin(lo0), math.cos(la0)])

def ecef(lat, lon, r=1.0):
    la, lo = np.radians(lat), np.radians(lon)
    return r * np.stack([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)], -1)

def to_screen(p):
    """ECEF (unit radius) -> screen px (2x) + depth z (camera toward viewer)."""
    x = p @ e; y = p @ n; z = p @ f
    return CX + x * R, CY - y * R, z

# ---------- raster ----------
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
dx = (xx - CX) / R
dy = -(yy - CY) / R
d2 = dx * dx + dy * dy
inside = d2 <= 1.0
dz = np.sqrt(np.clip(1.0 - d2, 0, 1))
P = dx[..., None] * e + dy[..., None] * n + dz[..., None] * f
lat = np.degrees(np.arcsin(np.clip(P[..., 2], -1, 1)))
lon = np.degrees(np.arctan2(P[..., 1], P[..., 0]))
u = ((lon + 180) / 360 * (TW - 1)).astype(np.int32)
v = ((90 - lat) / 180 * (TH - 1)).astype(np.int32)
col = tex[np.clip(v, 0, TH - 1), np.clip(u, 0, TW - 1)]

# lighting (camera space normal = (dx, dy, dz))
sun = np.array([0.55, 0.45, 0.70]); sun /= np.linalg.norm(sun)
ndl = np.clip(dx * sun[0] + dy * sun[1] + dz * sun[2], 0, 1)
diffuse = 0.18 + 0.95 * ndl ** 0.9
ocean = (col[..., 2] > col[..., 0] + 0.04) & (col[..., 2] > col[..., 1])
# specular (view dir = +z)
hvec = sun + np.array([0, 0, 1.0]); hvec /= np.linalg.norm(hvec)
spec = np.clip(dx * hvec[0] + dy * hvec[1] + dz * hvec[2], 0, 1) ** 60 * 0.55 * ocean
img = col * diffuse[..., None] + spec[..., None] * np.array([0.85, 0.92, 1.0])
# subtle contrast / tone
img = np.clip(img, 0, 1) ** 0.95

# SAA heat (surface glow following the sphere)
dlon = ((lon - (-50.0) + 180) % 360) - 180
g = np.exp(-((dlon / 24.0) ** 2 + ((lat - (-27.0)) / 14.0) ** 2))
heat = (g * 0.42)[..., None]
heat_col = np.array([1.0, 0.22, 0.20])
img = img * (1 - heat * 0.55) + heat_col * heat * 0.9

# atmosphere rim inside the disk
rim = (1 - dz) ** 3
img = img + rim[..., None] * np.array([0.25, 0.55, 1.0]) * 0.55 * (0.35 + 0.65 * np.clip(ndl + 0.2, 0, 1))[..., None]
img[~inside] = 0

# space background + stars + outer halo
rng = np.random.default_rng(7)
bg = np.zeros((H, W, 3), np.float32) + np.array([0.015, 0.025, 0.045])
stars = rng.random((H, W)) > 0.9985
bri = rng.random((H, W)) * 0.6 + 0.2
bg[stars] += (bri[stars])[:, None] * np.array([0.85, 0.9, 1.0])
dist = np.sqrt(d2)
halo = np.exp(-np.clip(dist - 1.0, 0, None) * R / (26 * S)) * (~inside)
bg += halo[..., None] * np.array([0.18, 0.45, 0.95]) * 0.75
out = np.where(inside[..., None], img, bg)

# vignette
vx = (xx / W - 0.5) * 2; vy = (yy / H - 0.5) * 2
vig = 1 - 0.35 * np.clip(vx * vx * 0.6 + vy * vy * 0.6, 0, 1)
out = np.clip(out * vig[..., None], 0, 1)
Image.fromarray((out * 255).astype(np.uint8)).save("globe.png", optimize=True)

# ---------- vector overlays (1x coords) ----------
def visible(sx, sy, z):
    return z > 0 or math.hypot(sx - CX, sy - CY) > R

def orbit_points(lat_pass, lon_pass, inc=97.5, alt_ratio=1.08, n_pts=720):
    """Circular orbit plane through the point (lat_pass, lon_pass), inclination inc."""
    i = math.radians(inc)
    # find RAAN such that orbit passes over point: solve on a grid
    best = None
    for raan in np.arange(-180, 180, 0.25):
        O = math.radians(raan)
        # orbit normal
        nrm = np.array([math.sin(i) * math.sin(O), -math.sin(i) * math.cos(O), math.cos(i)])
        p = ecef(lat_pass, lon_pass)
        d = abs(p @ nrm)
        if best is None or d < best[0]:
            best = (d, O)
    O = best[1]
    nrm = np.array([math.sin(i) * math.sin(O), -math.sin(i) * math.cos(O), math.cos(i)])
    a = np.array([math.cos(O), math.sin(O), 0.0])
    b = np.cross(nrm, a)
    ts = np.linspace(0, 2 * math.pi, n_pts)
    pts = np.array([math.cos(t) * a + math.sin(t) * b for t in ts])
    return pts * alt_ratio, pts

def path_segments(pts):
    segs, cur = [], []
    for p in pts:
        sx, sy, z = to_screen(p)
        if visible(sx, sy, z) and -40 * S < sx < W + 40 * S and -40 * S < sy < H + 40 * S:
            cur.append(f"{sx / S:.1f} {sy / S:.1f}")
        else:
            if len(cur) > 1: segs.append("M" + " L".join(cur))
            cur = []
    if len(cur) > 1: segs.append("M" + " L".join(cur))
    return " ".join(segs)

def surface_path(pts):
    segs, cur = [], []
    for p in pts:
        sx, sy, z = to_screen(p)
        if z > 0.02:
            cur.append(f"{sx / S:.1f} {sy / S:.1f}")
        else:
            if len(cur) > 1: segs.append("M" + " L".join(cur))
            cur = []
    if len(cur) > 1: segs.append("M" + " L".join(cur))
    return " ".join(segs)

def pt(lat, lon, r=1.0):
    sx, sy, z = to_screen(ecef(lat, lon, r))
    return [round(sx / S, 1), round(sy / S, 1), round(float(z), 3)]

orbA, gA = orbit_points(-24.8, -65.4)
orbB, gB = orbit_points(-30.0, -84.0)

def sat_on(orb, lat_target, descending=True):
    best = None
    for k in range(len(orb) - 1):
        p = orb[k] / np.linalg.norm(orb[k]); q = orb[k + 1] / np.linalg.norm(orb[k + 1])
        la = math.degrees(math.asin(p[2])); lb = math.degrees(math.asin(q[2]))
        if descending and lb > la: continue
        if best is None or abs(la - lat_target) < best[0]:
            best = (abs(la - lat_target), orb[k])
    sx, sy, z = to_screen(best[1])
    return [round(sx / S, 1), round(sy / S, 1)]

def sat_near(orb, lat, lon):
    p0 = ecef(lat, lon)
    k = int(np.argmax([(q/np.linalg.norm(q)) @ p0 for q in orb]))
    sx, sy, z = to_screen(orb[k])
    return [round(sx / S, 1), round(sy / S, 1)]

# SAA contour ellipses in lat/lon
def ell(lat_c, lon_c, a_lon, b_lat, n_pts=240):
    segs, cur = [], []
    for t in np.linspace(0, 2 * math.pi, n_pts):
        la = lat_c + b_lat * math.sin(t); lo = lon_c + a_lon * math.cos(t)
        sx, sy, z = to_screen(ecef(la, lo))
        if z > 0.02: cur.append(f"{sx / S:.1f} {sy / S:.1f}")
        else:
            if len(cur) > 1: segs.append("M" + " L".join(cur)); cur = []
    if len(cur) > 1: segs.append("M" + " L".join(cur) + (" Z" if not segs else ""))
    return " ".join(segs)

geo = {
    "orbitA": path_segments(orbA), "groundA": surface_path(gA),
    "orbitB": path_segments(orbB), "groundB": surface_path(gB),
    "satA": sat_on(orbA, -17.5), "satB": sat_near(orbB, -23.0, -83.0),
    "lote": pt(-23.1, -64.3), "saaC": pt(-27, -50),
    "saa1": ell(-27, -50, 30, 17), "saa2": ell(-27, -50, 15, 8.5),
    "cities": {k: pt(*v) for k, v in {"Salta": (-24.8, -65.4), "Buenos Aires": (-34.6, -58.4), "Santiago": (-33.45, -70.66),
                                      "Lima": (-12.05, -77.04), "São Paulo": (-23.55, -46.63), "Brasília": (-15.8, -47.9)}.items()},
    "limb": {"cx": CX / S, "cy": CY / S, "r": R / S},
}
json.dump(geo, open("globe.json", "w"))
print(json.dumps({k: (v if not isinstance(v, str) else len(v)) for k, v in geo.items()}, indent=0))
