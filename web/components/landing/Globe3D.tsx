"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { satAt, type SatDef, type SatNow } from "@/lib/sky";
import { device } from "./device";

export type GlobeAlert = { id: string; field: string; lat: number; lon: number; count: number; note: string };

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

/** Satélite liviano (cuerpo dorado + dos paneles), para no bajar 5,5 MB de modelos en teléfonos. */
function lightSatellite() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.55), new THREE.MeshStandardMaterial({ color: 0xd4a84a, metalness: 0.7, roughness: 0.35 }));
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1d3f8f, metalness: 0.4, roughness: 0.45, side: THREE.DoubleSide });
  for (const sx of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.32), panelMat);
    p.position.x = sx * 0.68;
    g.add(p);
  }
  g.add(body);
  g.scale.setScalar(SAT_SIZE);
  return g;
}

function satelliteSlot(name: string, color: number, lite: boolean) {
  const g = new THREE.Group();
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 20, 20),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  halo.name = "halo";
  g.add(halo);
  const url = lite ? undefined : MODEL_URL[name];
  if (!url) { g.add(lightSatellite()); return g; }
  loadModel(url).then((m) => g.add(m.clone(true))).catch(() => {
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

/** Bruma azul sobre el borde del planeta (dispersión de día), del lado visible. */
function haze() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.014, 96, 96),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vN; varying vec3 vP;
        void main(){ vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `varying vec3 vN; varying vec3 vP;
        void main(){ float f = pow(1.0 - clamp(dot(vN, normalize(-vP)), 0.0, 1.0), 3.0); gl_FragColor = vec4(0.45, 0.72, 1.0, 1.0) * f * 0.95; }`,
    }),
  );
}


type Props = {
  sats: SatNow[];
  defs: SatDef[];
  now: Date;
  alerts: GlobeAlert[];
  /** Contenido HTML de cada pin (mismo pin que la cartera). Se posiciona sin re-render de React. */
  renderPin: (a: GlobeAlert, i: number) => ReactNode;
};

/**
 * Globo 3D de la landing (three.js), de día: textura NASA Blue Marble con agua más clara, relieve, brillo del mar,
 * nubes y atmósfera. Solo marca las alertas (fuego dentro de un campo asegurado) con el pin de la cartera, y los
 * satélites reales por SGP4 con su órbita. Arrastrable; sin zoom para no secuestrar el scroll.
 * Rendimiento: dibuja solo cuando está en pantalla y la pestaña visible; los pines se mueven por transform
 * directo (sin setState por frame); las órbitas se recalculan una vez por minuto y se liberan.
 */
export function Globe3D({ sats, defs, now, alerts, renderPin }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const pinEls = useRef<(HTMLDivElement | null)[]>([]);
  const api = useRef<{ setAlerts: (a: GlobeAlert[]) => void; setSats: (s: SatNow[], d: SatDef[], t: Date, rebuild: boolean) => void } | null>(null);
  // sin WebGL (o si el contexto se pierde) se muestra una imagen fija del globo: la página nunca se rompe
  const [fallback, setFallback] = useState(() => !device().webgl);

  useEffect(() => {
    if (fallback) return;
    const el = host.current!;
    const { reduce, lite, coarse } = device();
    const small = lite;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: small ? "default" : "high-performance" });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.prepend(renderer.domElement);
    Object.assign(renderer.domElement.style, { display: "block", opacity: "0", transition: "opacity 700ms ease" });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    camera.position.copy(vec(-20, -60, 4.5));

    const controls = new OrbitControls(camera, renderer.domElement);
    // en pantallas táctiles el globo gira solo y no captura el dedo: el scroll vertical de la página sigue andando
    controls.enabled = !coarse;
    renderer.domElement.style.touchAction = coarse ? "pan-y" : "none";
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.25;
    let idle: ReturnType<typeof setTimeout> | undefined;
    controls.addEventListener("start", () => { controls.autoRotate = false; clearTimeout(idle); });
    controls.addEventListener("end", () => { idle = setTimeout(() => (controls.autoRotate = !reduce), 6000); });

    // de día y parejo: la luz sale casi desde la cámara, así los dos lados del globo quedan iguales;
    // el volumen viene del borde que se oscurece suave y de la atmósfera
    scene.add(new THREE.AmbientLight(0xeaf4ff, 0.9));
    scene.add(new THREE.HemisphereLight(0xf2f8ff, 0x2a4a6a, 0.35));
    const sun = new THREE.DirectionalLight(0xfffaf0, 2.3);
    sun.position.set(0, 0.8, 5);
    camera.add(sun);
    scene.add(camera);

    // el globo aparece recién con todas sus texturas (sin el disco negro mientras cargan)
    const manager = new THREE.LoadingManager(() => { renderer.domElement.style.opacity = "1"; if (onScreen) draw(); });
    const loader = new THREE.TextureLoader(manager);
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const earthTex = loader.load(small ? "/textures/earth-day-light-2k.jpg" : "/textures/earth-day-light.jpg");
    earthTex.colorSpace = THREE.SRGBColorSpace;
    earthTex.anisotropy = aniso;
    const roughTex = loader.load("/textures/earth-rough.jpg");   // mar brillante, tierra mate
    const bumpTex = loader.load("/textures/earth-bump.jpg");     // relieve suave en la tierra
    const cloudTex = loader.load("/textures/earth-clouds.png");  // nubes procedurales, despejado sobre el NOA
    cloudTex.colorSpace = THREE.SRGBColorSpace;
    cloudTex.anisotropy = aniso;
    const seg = small ? 64 : 96;
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(R, seg, seg),
      new THREE.MeshStandardMaterial({ map: earthTex, roughnessMap: roughTex, roughness: 1, metalness: 0, bumpMap: bumpTex, bumpScale: 0.5 }),
    );
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(R * 1.008, seg, seg),
      new THREE.MeshStandardMaterial({ map: cloudTex, transparent: true, depthWrite: false, roughness: 1, metalness: 0 }),
    );
    scene.add(earth, clouds, haze(), atmosphere());

    const satGroup = new THREE.Group();
    const trackGroup = new THREE.Group();
    scene.add(trackGroup, satGroup);
    const trackMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
    const satModels = new Map<string, THREE.Group>();
    let anchors: THREE.Vector3[] = [];

    api.current = {
      setAlerts(a) { anchors = a.map((al) => vec(al.lat, al.lon, R * 1.004)); },
      setSats(s, d, t, rebuild) {
        for (const x of s) {
          if (x.kind !== "polar") continue;
          let m = satModels.get(x.name);
          if (!m) {
            m = satelliteSlot(x.name, 0xffffff, lite);
            satModels.set(x.name, m);
            satGroup.add(m);
          }
          m.position.copy(vec(x.lat, x.lon, R + x.altKm / EARTH_KM));
          m.lookAt(0, 0, 0);
        }
        if (!rebuild) return;
        // órbitas: ±40 min alrededor de ahora; se liberan las geometrías viejas para no acumular memoria
        trackGroup.children.forEach((c) => (c as THREE.Line).geometry.dispose());
        trackGroup.clear();
        for (const def of d) {
          const cur = s.find((x) => x.name === def.name);
          if (!cur || cur.kind !== "polar") continue;
          const pts: THREE.Vector3[] = [];
          for (let k = -40; k <= 40; k += 2) {
            const q = satAt(def, new Date(t.getTime() + k * 60_000));
            if (q) pts.push(vec(q.lat, q.lon, R + q.altKm / EARTH_KM));
          }
          if (pts.length > 1) trackGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), trackMat));
        }
      },
    };

    const size = { w: 1, h: 1 };
    const resize = () => {
      size.w = el.clientWidth; size.h = el.clientHeight;
      renderer.setSize(size.w, size.h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      camera.aspect = size.w / Math.max(1, size.h);
      camera.updateProjectionMatrix();
      // que entre entero (con su halo) también cuando el lienzo es más angosto que alto: alejar la cámara
      const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const fit = (R * 1.1) / (half * Math.min(1, camera.aspect));
      camera.position.setLength(Math.max(4.2, fit / 0.97));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // el loop corre solo con el globo en pantalla y la pestaña visible; si no, se detiene del todo
    let raf = 0;
    let onScreen = false;
    const start = () => { if (!raf && onScreen && !document.hidden) { draw(); raf = requestAnimationFrame(tick); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) start(); else stop(); }, { rootMargin: "100px" });
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const onLost = (e: Event) => { e.preventDefault(); stop(); setFallback(true); };
    renderer.domElement.addEventListener("webglcontextlost", onLost);

    const tmp = new THREE.Vector3();
    const camN = new THREE.Vector3();
    const tick = () => { raf = requestAnimationFrame(tick); draw(); };
    function draw() {
      controls.update();
      if (!reduce) clouds.rotation.y += 0.00006;
      renderer.render(scene, camera);
      // pines: transform directo sobre el DOM
      camN.copy(camera.position).normalize();
      anchors.forEach((p, i) => {
        const pin = pinEls.current[i];
        if (!pin) return;
        const facing = tmp.copy(p).normalize().dot(camN) > 0.15;
        tmp.copy(p).project(camera);
        pin.style.transform = `translate3d(${((tmp.x * 0.5 + 0.5) * size.w).toFixed(1)}px, ${((-tmp.y * 0.5 + 0.5) * size.h).toFixed(1)}px, 0)`;
        pin.style.opacity = facing ? "1" : "0";
      });
    }
    return () => {
      stop();
      clearTimeout(idle);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      controls.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      [earthTex, roughTex, bumpTex, cloudTex].forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, [fallback]);

  useEffect(() => { api.current?.setAlerts(alerts); }, [alerts, fallback]);
  const minute = Math.floor(now.getTime() / 60_000);
  const last = useRef<{ minute: number; defs: SatDef[] | null }>({ minute: -1, defs: null });
  useEffect(() => {
    const rebuild = last.current.minute !== minute || last.current.defs !== defs;
    last.current = { minute, defs };
    api.current?.setSats(sats, defs, new Date(minute * 60_000), rebuild);
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sats, defs, fallback]);

  if (fallback) {
    return (
      <div className="absolute inset-0 grid place-items-center p-6">
        <img src="/landing/globe-disk.webp" alt="Globo terrestre centrado en Sudamérica" decoding="async" className="h-full max-h-[620px] w-auto object-contain" />
      </div>
    );
  }

  return (
    <div ref={host} className="absolute inset-0 md:cursor-grab md:active:cursor-grabbing">
      {alerts.map((a, i) => (
        <div key={a.id} ref={(n) => { pinEls.current[i] = n; }} className="pointer-events-none absolute left-0 top-0 opacity-0 transition-opacity duration-300 will-change-transform">
          {renderPin(a, i)}
        </div>
      ))}
    </div>
  );
}
