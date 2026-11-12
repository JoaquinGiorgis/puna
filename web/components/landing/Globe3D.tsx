"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { SAA, satAt, type Fire, type SatDef, type SatNow } from "@/lib/sky";

export type GlobeAlert = { id: string; field: string; lat: number; lon: number; count: number };

const R = 1;
const EARTH_KM = 6371;

/** lat/lon en grados → punto en la esfera (misma convención de UV que SphereGeometry). */
function vec(lat: number, lon: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

/** Modelos 3D reales de la NASA (NASA 3D Resources, dominio público). NOAA-20/21 usan la plataforma de Suomi NPP. */
const MODEL_URL: Record<string, string> = {
  "NOAA-20": "/models/suomi-npp.glb", "NOAA-21": "/models/suomi-npp.glb", Aqua: "/models/aqua.glb", Terra: "/models/terra.glb",
};
const SAT_SIZE = 0.085; // exagerado: a escala real no se verían
const gltfCache = new Map<string, Promise<THREE.Object3D>>();
function loadModel(url: string) {
  if (!gltfCache.has(url)) {
    gltfCache.set(url, new GLTFLoader().loadAsync(url).then((gltf) => {
      const root = gltf.scene;
      const box = new THREE.Box3().setFromObject(root);
      const size = box.getSize(new THREE.Vector3());
      root.position.sub(box.getCenter(new THREE.Vector3()));
      const wrap = new THREE.Group();
      wrap.add(root);
      wrap.scale.setScalar(SAT_SIZE / Math.max(size.x, size.y, size.z));
      return wrap;
    }));
  }
  return gltfCache.get(url)!;
}

function satelliteSlot(name: string, color: number) {
  const g = new THREE.Group();
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 20, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  halo.name = "halo";
  g.add(halo);
  const url = MODEL_URL[name];
  if (url) loadModel(url).then((m) => g.add(m.clone(true))).catch(() => {
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.04), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.8, roughness: 0.4 })));
  });
  return g;
}

/** Contorno de la Anomalía del Atlántico Sur, interpolado sobre la esfera. */
function saaLine() {
  const pts: THREE.Vector3[] = [];
  const ring = [...SAA, SAA[0]];
  for (let i = 0; i < ring.length - 1; i++) {
    const [lo1, la1] = ring[i], [lo2, la2] = ring[i + 1];
    for (let k = 0; k < 12; k++) {
      const t = k / 12;
      pts.push(vec(la1 + (la2 - la1) * t, lo1 + (lo2 - lo1) * t, R * 1.004));
    }
  }
  pts.push(pts[0].clone());
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineDashedMaterial({ color: 0xff5a4e, dashSize: 0.025, gapSize: 0.018, transparent: true, opacity: 0.85 }),
  );
  line.computeLineDistances();
  return line;
}

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,220,140,1)");
  gr.addColorStop(0.3, "rgba(255,122,26,0.9)");
  gr.addColorStop(1, "rgba(255,90,20,0)");
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

type Props = {
  fires: Fire[];
  sats: SatNow[];
  defs: SatDef[];
  now: Date;
  alerts: GlobeAlert[];
  onLabels?: (pos: Record<string, { x: number; y: number; visible: boolean }>) => void;
};

/**
 * Globo 3D de la landing (three.js). Textura NASA Blue Marble, focos FIRMS en vivo como puntos de calor,
 * alertas (fuego dentro de un campo asegurado) como anclas para el pin HTML, satélites reales por SGP4 con su órbita,
 * y el contorno de la Anomalía del Atlántico Sur. Arrastrable; sin zoom para no secuestrar el scroll.
 */
export function Globe3D({ fires, sats, defs, now, alerts, onLabels }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{
    setFires: (f: Fire[]) => void;
    setAlerts: (a: GlobeAlert[]) => void;
    setSats: (s: SatNow[], d: SatDef[], now: Date) => void;
  } | null>(null);
  const labelCb = useRef(onLabels);
  labelCb.current = onLabels;

  useEffect(() => {
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    // cámara mirando el NOA, un poco desde el sur para ver la Anomalía y el Atlántico
    camera.position.copy(vec(-20, -60, 4.5));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.25;
    let idle: ReturnType<typeof setTimeout> | undefined;
    controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(idle); });
    controls.addEventListener("end", () => { idle = setTimeout(() => (controls.autoRotate = !reduce), 6000); });

    scene.add(new THREE.AmbientLight(0xb8c8e6, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 2.6);
    sun.position.copy(vec(5, -30, 6));
    scene.add(sun);

    const earthTex = new THREE.TextureLoader().load("/textures/earth-day.jpg");
    earthTex.colorSpace = THREE.SRGBColorSpace;
    earthTex.anisotropy = 8;
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(R, 96, 96),
      new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.9, metalness: 0.05, color: 0xe2e8f2 }),
    );
    scene.add(earth, saaLine());

    // grilla sutil de latitudes/longitudes
    const grid = new THREE.Group();
    const gridMat = new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.08 });
    for (let la = -60; la <= 60; la += 30) {
      const pts = Array.from({ length: 73 }, (_, i) => vec(la, -180 + i * 5, R * 1.002));
      grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let lo = -180; lo < 180; lo += 30) {
      const pts = Array.from({ length: 37 }, (_, i) => vec(-90 + i * 5, lo, R * 1.002));
      grid.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    scene.add(grid);

    // focos FIRMS: puntos de calor aditivos
    const fireGeo = new THREE.BufferGeometry();
    const fireMat = new THREE.PointsMaterial({ size: 0.013, map: dotTexture(), opacity: 0.85, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    const firePts = new THREE.Points(fireGeo, fireMat);
    scene.add(firePts);

    const alertGroup = new THREE.Group();
    const satGroup = new THREE.Group();
    const trackGroup = new THREE.Group();
    scene.add(alertGroup, trackGroup, satGroup);
    const satModels = new Map<string, THREE.Group>();
    let alertList: GlobeAlert[] = [];

    api.current = {
      setFires(f) {
        const arr = new Float32Array(f.length * 3);
        f.forEach((x, i) => vec(x.lat, x.lon, R * 1.003).toArray(arr, i * 3));
        fireGeo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        fireGeo.computeBoundingSphere();
      },
      setAlerts(a) {
        alertList = a;
        alertGroup.clear();
        for (const al of a) {
          // ancla invisible: el pin es el mismo ícono HTML que usa el dashboard
          const m = new THREE.Object3D();
          m.position.copy(vec(al.lat, al.lon, R));
          alertGroup.add(m);
        }
      },
      setSats(s, d, t) {
        for (const x of s) {
          if (x.kind !== "polar") continue;
          let m = satModels.get(x.name);
          if (!m) {
            m = satelliteSlot(x.name, x.inSaa ? 0xff5a4e : 0x3dd6f5);
            satModels.set(x.name, m);
            satGroup.add(m);
          }
          const p = vec(x.lat, x.lon, R + x.altKm / EARTH_KM);
          m.position.copy(p);
          m.lookAt(0, 0, 0);
          const halo = m.getObjectByName("halo") as THREE.Mesh;
          (halo.material as THREE.MeshBasicMaterial).color.setHex(x.inSaa ? 0xff5a4e : 0x3dd6f5);
        }
        // órbitas: ±40 min alrededor de ahora, recalculadas una vez por minuto
        trackGroup.clear();
        for (const def of d) {
          const cur = s.find((x) => x.name === def.name);
          if (!cur || cur.kind !== "polar") continue;
          const pts: THREE.Vector3[] = [];
          for (let k = -40; k <= 40; k += 2) {
            const q = satAt(def, new Date(t.getTime() + k * 60_000));
            if (q) pts.push(vec(q.lat, q.lon, R + q.altKm / EARTH_KM));
          }
          if (pts.length < 2) continue;
          trackGroup.add(new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: cur.inSaa ? 0xff5a4e : 0x7dd3fc, transparent: true, opacity: 0.35 }),
          ));
        }
      },
    };

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let raf = 0;
    const tmp = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      // posiciones en pantalla de las alertas, para las etiquetas de vidrio
      if (labelCb.current && alertList.length) {
        camera.getWorldDirection(camDir);
        const out: Record<string, { x: number; y: number; visible: boolean }> = {};
        alertList.forEach((al, i) => {
          const m = alertGroup.children[i];
          if (!m) return;
          tmp.copy(m.position);
          const facing = tmp.clone().normalize().dot(camera.position.clone().normalize()) > 0.15;
          tmp.project(camera);
          out[al.id] = { x: (tmp.x * 0.5 + 0.5) * el.clientWidth, y: (-tmp.y * 0.5 + 0.5) * el.clientHeight, visible: facing };
        });
        labelCb.current(out);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      ro.disconnect();
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      earthTex.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      api.current = null;
    };
  }, []);

  useEffect(() => { api.current?.setFires(fires); }, [fires]);
  useEffect(() => { api.current?.setAlerts(alerts); }, [alerts]);
  const minute = Math.floor(now.getTime() / 60_000);
  useEffect(() => { api.current?.setSats(sats, defs, new Date(minute * 60_000)); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sats, defs]);

  return <div ref={host} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-hidden="true" />;
}
