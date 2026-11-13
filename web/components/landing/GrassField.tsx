"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { device } from "./device";

/**
 * Pasto 3D (three.js) para el pie de "Problemas".
 * - Hojas instanciadas con curvatura propia, viento, luz lateral y translucidez en la punta.
 * - Mezcla de verdes con algunas hojas secas, más densas adelante y ralas hacia el fondo.
 * - Un suelo suave debajo para que no se vea el cielo entre las bases.
 * - Hacia el horizonte las hojas se disuelven (tramado, sin cortes) y el lienzo se difumina abajo con una máscara.
 * Solo renderiza mientras está en pantalla; `grow` lo hace crecer al entrar. Con prefers-reduced-motion queda quieto.
 */


const SKY = "#b8def6";

const bladeVert = /* glsl */ `
  attribute float aPhase;
  attribute float aLean;
  attribute vec3 aTint;
  uniform float uTime;
  uniform float uGrow;
  varying float vH;
  varying vec3 vTint;
  varying float vDepth;
  varying float vLight;
  void main() {
    vec3 p = position;
    float h = uv.y;
    p.x *= 1.0 - h * 0.94;
    p.y *= uGrow;
    p.z += h * h * aLean * 0.6;
    p.y -= h * h * abs(aLean) * 0.2;
    vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
    float gust = 0.6 + 0.4 * sin(uTime * 0.35 + world.x * 0.15);
    float wind = (sin(uTime * 1.4 + world.x * 0.9 + aPhase) * 0.55 + sin(uTime * 2.6 + world.z * 2.1 + aPhase * 0.7) * 0.2) * gust;
    float bend = wind * h * h * 0.22 * uGrow;
    world.x += bend;
    world.z += bend * 0.3;
    world.y -= abs(bend) * 0.3 * h;
    vec3 n = normalize(mat3(modelMatrix * instanceMatrix) * vec3(0.0, 0.0, 1.0));
    vLight = abs(dot(n, normalize(vec3(-0.6, 0.5, 0.6))));
    vH = h;
    vTint = aTint;
    vec4 mv = viewMatrix * world;
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const common = /* glsl */ `
  uniform vec3 uSky;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  // disolución tramada hacia el horizonte: sin transparencias ni orden de dibujo
  void fadeOut(float depth) {
    float a = 1.0 - smoothstep(7.5, 13.0, depth);
    if (a < hash(gl_FragCoord.xy)) discard;
  }
  vec3 aerial(vec3 col, float depth) { return mix(col, uSky, smoothstep(2.5, 12.0, depth) * 0.7); }
`;

const bladeFrag = /* glsl */ `
  ${common}
  varying float vH;
  varying vec3 vTint;
  varying float vDepth;
  varying float vLight;
  void main() {
    fadeOut(vDepth);
    vec3 base = vec3(0.09, 0.2, 0.06);
    vec3 mid = vec3(0.27, 0.48, 0.14);
    vec3 tip = vec3(0.62, 0.76, 0.32);
    vec3 col = vH < 0.5 ? mix(base, mid, vH * 2.0) : mix(mid, tip, (vH - 0.5) * 2.0);
    col *= vTint;
    col *= 0.62 + 0.5 * vLight;                                   // luz lateral
    col += vec3(0.1, 0.12, 0.02) * smoothstep(0.65, 1.0, vH);     // translucidez en la punta
    col *= 0.78 + 0.22 * smoothstep(0.0, 0.25, vH);               // oclusión en la base
    gl_FragColor = vec4(aerial(col, vDepth), 1.0);
  }
`;

const groundVert = /* glsl */ `
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const groundFrag = /* glsl */ `
  ${common}
  varying float vDepth;
  void main() {
    fadeOut(vDepth);
    gl_FragColor = vec4(aerial(vec3(0.16, 0.27, 0.09), vDepth), 1.0);
  }
`;

export function GrassField({ grow, className = "" }: { grow: boolean; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const growRef = useRef(grow);
  growRef.current = grow;

  useEffect(() => {
    const el = host.current!;
    const { reduce, lite: small, webgl, saveData } = device();
    if (!webgl || saveData) return;      // sin WebGL o con ahorro de datos el pasto es decorativo: se omite
    const COUNT = small ? 3200 : 8000;   // menos hojas en teléfonos y equipos modestos
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: true, powerPreference: "low-power" });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1 : 1.25));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%" });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 40);
    camera.position.set(0, 0.95, 5.6);
    camera.lookAt(0, 0.45, 0);

    const sky = new THREE.Color(SKY);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 20).rotateX(-Math.PI / 2).translate(0, 0, -5),
      new THREE.ShaderMaterial({ vertexShader: groundVert, fragmentShader: groundFrag, uniforms: { uSky: { value: sky } } }),
    );
    scene.add(ground);

    const blade = new THREE.PlaneGeometry(0.04, 1, 1, 7);
    blade.translate(0, 0.5, 0);
    const mat = new THREE.ShaderMaterial({
      vertexShader: bladeVert, fragmentShader: bladeFrag, side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 }, uGrow: { value: reduce ? 1 : 0 }, uSky: { value: sky } },
    });
    const mesh = new THREE.InstancedMesh(blade, mat, COUNT);
    const phase = new Float32Array(COUNT);
    const lean = new Float32Array(COUNT);
    const tint = new Float32Array(COUNT * 3);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); // determinista: el mismo campo en cada carga
    for (let i = 0; i < COUNT; i++) {
      // más hojas adelante (cerca de la cámara), ralas hacia el horizonte
      const z = 2.6 - Math.pow(rand(), 1.8) * 15;
      const width = 7 + (2.6 - z) * 0.75;
      let x = (rand() - 0.5) * width;
      if (rand() < 0.45) x = Math.round(x / 0.55) * 0.55 + (rand() - 0.5) * 0.3; // matas
      const tall = rand() < 0.07;
      const h = (0.22 + rand() * 0.42 + (tall ? 0.35 : 0)) * (z > 1.5 ? 0.85 : 1);
      e.set((rand() - 0.5) * 0.4, rand() * Math.PI, (rand() - 0.5) * 0.35);
      q.setFromEuler(e);
      m.compose(pos.set(x, 0, z), q, scl.set(0.8 + rand() * 0.9, h, 1));
      mesh.setMatrixAt(i, m);
      phase[i] = rand() * Math.PI * 2;
      lean[i] = (rand() - 0.5) * 1.7;
      const dry = rand() < 0.1;
      const t = 0.85 + rand() * 0.3;
      if (dry) tint.set([1.55 * t, 1.25 * t, 0.7 * t], i * 3);
      else tint.set([t * (0.92 + rand() * 0.14), t, t * (0.8 + rand() * 0.25)], i * 3);
    }
    blade.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
    blade.setAttribute("aLean", new THREE.InstancedBufferAttribute(lean, 1));
    blade.setAttribute("aTint", new THREE.InstancedBufferAttribute(tint, 3));
    scene.add(mesh);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // el loop corre solo en pantalla y con la pestaña visible; con movimiento reducido se dibuja una vez
    let raf = 0;
    let visible = false;
    const clock = new THREE.Clock();
    const start = () => {
      if (reduce) { renderer.render(scene, camera); return; }
      if (!raf && visible && !document.hidden) { clock.getDelta(); renderer.render(scene, camera); raf = requestAnimationFrame(tick); }
    };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); else stop(); });
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const onLost = (e: Event) => { e.preventDefault(); stop(); renderer.domElement.style.display = "none"; };
    renderer.domElement.addEventListener("webglcontextlost", onLost);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const u = mat.uniforms;
      if (!reduce) {
        u.uTime.value += dt;
        const target = growRef.current ? 1 : 0;
        u.uGrow.value += (target - u.uGrow.value) * Math.min(1, dt * 1.6);
      }
      renderer.render(scene, camera);
    };
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      blade.dispose();
      mat.dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
