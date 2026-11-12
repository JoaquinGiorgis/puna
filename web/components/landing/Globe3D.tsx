"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
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

/** Llama 3D: perfil de gota girado (lathe) con un núcleo amarillo, más anillo y haz. */
function flameMarker() {
  const g = new THREE.Group();
  const prof: THREE.Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    prof.push(new THREE.Vector2(Math.sin(Math.PI * t) ** 1.4 * (1 - t * 0.55) * 0.022, t * 0.075));
  }
  const outer = new THREE.Mesh(
    new THREE.LatheGeometry(prof, 24),
    new THREE.MeshStandardMaterial({ color: 0xff5a1f, emissive: 0xff4a10, emissiveIntensity: 1.6, roughness: 0.4, transparent: true, opacity: 0.95 }),
  );
  const inner = new THREE.Mesh(
    new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(p.x * 0.55, p.y * 0.7)), 18),
    new THREE.MeshStandardMaterial({ color: 0xffd24a, emissive: 0xffc23a, emissiveIntensity: 2.2 }),
  );
  inner.position.y = 0.004;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.026, 0.032, 48),
    new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.name = "ring";
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0015, 0.004, 0.22, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff8a3d, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  beam.position.y = 0.11;
  g.add(outer, inner, ring, beam);
  return g;
}

/** Satélite 3D: cuerpo con aislante dorado, dos paneles solares y antena. */
function satelliteModel(color: number) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.045), new THREE.MeshStandardMaterial({ color: 0xc9a24a, metalness: 0.85, roughness: 0.35 }));
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1b3f8f, metalness: 0.5, roughness: 0.3, emissive: 0x0a1e4a, emissiveIntensity: 0.6 });
  const panelGeo = new THREE.BoxGeometry(0.075, 0.002, 0.032);
  const p1 = new THREE.Mesh(panelGeo, panelMat);
  p1.position.x = 0.058;
  const p2 = p1.clone();
  p2.position.x = -0.058;
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.03, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
  ant.position.y = 0.03;
  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.009, 0.006, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xeeeeee, side: THREE.DoubleSide }));
  dish.position.y = 0.046;
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 16),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  halo.name = "halo";
  g.add(body, p1, p2, ant, dish, halo);
  return g;
}

/** Brillo de borde (atmósfera) por fresnel. */
function atmosphere() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.035, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
      uniforms: { c: { value: new THREE.Color(0x3dd6f5) } },
      vertexShader: "varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix*normal); vec4 p = modelViewMatrix*vec4(position,1.0); vP = p.xyz; gl_Position = projectionMatrix*p; }",
      fragmentShader: "uniform vec3 c; varying vec3 vN; varying vec3 vP; void main(){ float f = pow(max(0.0, 0.62 - dot(vN, normalize(-vP))), 2.5); gl_FragColor = vec4(c, clamp(f,0.0,1.0)*0.9); }",
    }),
  );
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
 * alertas (fuego dentro de un campo asegurado) como llamas 3D, satélites reales por SGP4 con su órbita,
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
    scene.add(earth, atmosphere(), saaLine());

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
          const m = flameMarker();
          const p = vec(al.lat, al.lon, R);
          m.position.copy(p);
          m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
          m.userData.phase = Math.random() * Math.PI * 2;
          m.scale.setScalar(2.4);
          alertGroup.add(m);
        }
      },
      setSats(s, d, t) {
        for (const x of s) {
          if (x.kind !== "polar") continue;
          let m = satModels.get(x.name);
          if (!m) {
            m = satelliteModel(x.inSaa ? 0xff5a4e : 0x3dd6f5);
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
    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    const tick = () => {
      const t = clock.getElapsedTime();
      controls.update();
      if (!reduce) {
        alertGroup.children.forEach((m) => {
          const ph = (t * 1.2 + m.userData.phase) % 1;
          const ring = m.getObjectByName("ring")!;
          ring.scale.setScalar(1 + ph * 2.2);
          ((ring as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - ph);
          m.children[0].scale.set(1, 1 + Math.sin(t * 9 + m.userData.phase) * 0.12, 1);
        });
      }
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
