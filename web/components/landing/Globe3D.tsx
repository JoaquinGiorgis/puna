"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { satAt, type SatDef, type SatNow } from "@/lib/sky";

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

/** Halo atmosférico: esfera apenas más grande, brillo Fresnel celeste en el borde. Le da volumen sobre el cielo claro. */
function atmosphere() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.12, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vN; varying vec3 vP;
        void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vN; varying vec3 vP;
        void main(){ float f = pow(clamp(-dot(vN, normalize(-vP)), 0.0, 1.0), 2.4); gl_FragColor = vec4(0.55, 0.82, 1.0, 1.0) * f * 0.9; }`,
    }),
  );
}

/** Baliza de alerta: punto rojo brillante, columna de luz hacia afuera y anillo que late. */
function glowTexture(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, inner);
  gr.addColorStop(0.35, outer);
  gr.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const GLOW = typeof document !== "undefined" ? glowTexture("rgba(255,235,225,1)", "rgba(230,40,30,0.9)") : null;

function beacon() {
  const g = new THREE.Group();
  const dot = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, depthWrite: false, blending: THREE.AdditiveBlending }));
  dot.scale.setScalar(0.09);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.012, 0.32, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  beam.position.y = 0.16;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.03, 0.036, 48),
    new THREE.MeshBasicMaterial({ color: 0xff5a4e, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.name = "ring";
  const tilt = new THREE.Group(); // el eje Y local apunta hacia afuera de la esfera
  tilt.add(beam, ring);
  g.add(dot, tilt);
  g.userData.tilt = tilt;
  return g;
}

type Props = {
  sats: SatNow[];
  defs: SatDef[];
  now: Date;
  alerts: GlobeAlert[];
  onLabels?: (pos: Record<string, { x: number; y: number; visible: boolean }>) => void;
};

/**
 * Globo 3D de la landing (three.js) sobre el cielo claro. Textura NASA Blue Marble con atmósfera,
 * solo las alertas (fuego dentro de un campo asegurado) como balizas 3D, y satélites reales por SGP4 con su órbita.
 * Arrastrable; sin zoom para no secuestrar el scroll.
 */
export function Globe3D({ sats, defs, now, alerts, onLabels }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{
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

    scene.add(new THREE.AmbientLight(0xcfe3f7, 0.55));
    scene.add(new THREE.HemisphereLight(0xdff1ff, 0x0b2440, 0.35));
    const sun = new THREE.DirectionalLight(0xfff4e0, 3.1);
    sun.position.copy(vec(18, -20, 6)).add(new THREE.Vector3(-2.5, 1.5, 0));
    scene.add(sun);

    const earthTex = new THREE.TextureLoader().load("/textures/earth-day.jpg");
    earthTex.colorSpace = THREE.SRGBColorSpace;
    earthTex.anisotropy = 8;
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(R, 96, 96),
      new THREE.MeshStandardMaterial({ map: earthTex, roughness: 0.75, metalness: 0.05, color: 0xf2f6fb }),
    );
    scene.add(earth, atmosphere());

    const alertGroup = new THREE.Group();
    const satGroup = new THREE.Group();
    const trackGroup = new THREE.Group();
    scene.add(alertGroup, trackGroup, satGroup);
    const satModels = new Map<string, THREE.Group>();
    let alertList: GlobeAlert[] = [];

    api.current = {
      setAlerts(a) {
        alertList = a;
        alertGroup.clear();
        for (const al of a) {
          const m = beacon();
          const p = vec(al.lat, al.lon, R * 1.004);
          m.position.copy(p);
          (m.userData.tilt as THREE.Group).quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
          alertGroup.add(m);
        }
      },
      setSats(s, d, t) {
        for (const x of s) {
          if (x.kind !== "polar") continue;
          let m = satModels.get(x.name);
          if (!m) {
            m = satelliteSlot(x.name, 0xffffff);
            satModels.set(x.name, m);
            satGroup.add(m);
          }
          const p = vec(x.lat, x.lon, R + x.altKm / EARTH_KM);
          m.position.copy(p);
          m.lookAt(0, 0, 0);
          const halo = m.getObjectByName("halo") as THREE.Mesh;
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
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }),
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
    const t0 = performance.now();
    const tick = () => {
      controls.update();
      if (!reduce) {
        const k = ((performance.now() - t0) / 1600) % 1;
        alertGroup.children.forEach((b) => {
          const ring = (b.userData.tilt as THREE.Group).getObjectByName("ring") as THREE.Mesh;
          ring.scale.setScalar(1 + k * 2.2);
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k);
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

  useEffect(() => { api.current?.setAlerts(alerts); }, [alerts]);
  const minute = Math.floor(now.getTime() / 60_000);
  useEffect(() => { api.current?.setSats(sats, defs, new Date(minute * 60_000)); },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sats, defs]);

  return <div ref={host} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-hidden="true" />;
}
