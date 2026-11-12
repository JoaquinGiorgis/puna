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

const NOISE = `
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<5;i++){ v += a*vnoise(p); p *= 2.07; a *= 0.5; } return v; }`;

/** Material de llama volumétrica: ruido fractal que sube, silueta de lágrima y rampa de temperatura. */
function flameMaterial(seed: number) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
    fragmentShader: `uniform float uTime; uniform float uSeed; varying vec2 vUv; ${NOISE}
      void main(){
        vec2 uv = vUv;
        float t = uTime*1.7 + uSeed*13.0;
        float n = fbm(vec2(uv.x*3.2 + uSeed, uv.y*2.6 - t));
        float n2 = fbm(vec2(uv.x*6.0 - uSeed, uv.y*5.0 - t*1.6));
        float x = (uv.x - 0.5)*2.0 + (n - 0.5)*0.7*uv.y;
        float w = mix(0.95, 0.06, pow(uv.y, 0.8));
        float body = smoothstep(1.0, 0.15, abs(x)/w);
        float top = smoothstep(0.98, 0.45, uv.y + (n2 - 0.5)*0.45);
        float flame = body * top * smoothstep(0.0, 0.07, uv.y);
        float heat = clamp(flame*(1.25 - uv.y*0.9) + (n2 - 0.5)*0.2, 0.0, 1.0);
        vec3 col = mix(vec3(0.55, 0.06, 0.01), vec3(1.0, 0.42, 0.05), smoothstep(0.1, 0.5, heat));
        col = mix(col, vec3(1.0, 0.86, 0.45), smoothstep(0.55, 0.9, heat));
        col = mix(col, vec3(1.0, 0.98, 0.9), smoothstep(0.9, 1.0, heat));
        gl_FragColor = vec4(col*flame*1.8, flame);
      }`,
  });
}

/** Brasas: partículas que suben y se apagan (todo en el shader de vértices). */
function embers(seed: number) {
  const N = 26;
  const a = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { a[i * 3] = Math.random(); a[i * 3 + 1] = Math.random(); a[i * 3 + 2] = Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(a, 3));
  return new THREE.Points(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed } },
    vertexShader: `uniform float uTime; uniform float uSeed; varying float vLife;
      void main(){
        float life = fract(position.y + uTime*(0.25 + position.z*0.35) + uSeed);
        vLife = life;
        vec3 p = vec3((position.x - 0.5)*0.05 + sin(life*9.0 + position.z*20.0)*0.012, life*0.2, (position.z - 0.5)*0.05);
        vec4 mv = modelViewMatrix*vec4(p, 1.0);
        gl_PointSize = (1.0 - life) * 7.0 * (1.0/ -mv.z);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: `varying float vLife;
      void main(){ float d = length(gl_PointCoord - 0.5); if(d > 0.5) discard;
        vec3 c = mix(vec3(1.0, 0.8, 0.4), vec3(1.0, 0.25, 0.02), vLife);
        gl_FragColor = vec4(c, (1.0 - vLife) * smoothstep(0.5, 0.0, d)); }`,
  }));
}

/** Alerta de fuego 3D: llama volumétrica (tres planos cruzados), brasas, resplandor en el suelo y anillo. */
function fireMarker() {
  const g = new THREE.Group();
  const seed = Math.random() * 10;
  const mat = flameMaterial(seed);
  const plane = new THREE.PlaneGeometry(0.075, 0.13);
  plane.translate(0, 0.065, 0);
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(plane, mat);
    m.rotation.y = (i * Math.PI) / 3;
    g.add(m);
  }
  const em = embers(seed);
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.06, 32),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: "varying vec2 vUv; void main(){ float d = length(vUv - 0.5)*2.0; gl_FragColor = vec4(vec3(1.0,0.35,0.05)*(1.0-d), (1.0-d)*0.8); }",
    }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.002;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.056, 64),
    new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.name = "ring";
  g.add(em, glow, ring);
  g.userData.uniforms = [mat.uniforms, (em.material as THREE.ShaderMaterial).uniforms];
  return g;
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
          const m = fireMarker();
          const p = vec(al.lat, al.lon, R);
          m.position.copy(p);
          m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
          m.userData.phase = Math.random() * Math.PI * 2;
          m.scale.setScalar(2.6);
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
    const t0 = performance.now();
    const tmp = new THREE.Vector3();
    const camDir = new THREE.Vector3();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      controls.update();
      alertGroup.children.forEach((m) => {
        for (const u of m.userData.uniforms as { uTime: { value: number } }[]) u.uTime.value = reduce ? 1.5 : t;
        if (reduce) return;
        const ph = (t * 0.8 + m.userData.phase) % 1;
        const ring = m.getObjectByName("ring")!;
        ring.scale.setScalar(1 + ph * 1.8);
        ((ring as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - ph);
      });
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
