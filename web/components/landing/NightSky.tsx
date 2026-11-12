"use client";

import { useEffect, useRef } from "react";

/**
 * Cielo nocturno de fondo: shader GLSL propio en WebGL2, sin dependencias.
 * - Estrellas en tres capas con brillo de cola larga (pocas muy brillantes, muchas tenues), color según
 *   temperatura (de azuladas a anaranjadas), núcleo nítido con halo y centelleo lento.
 * - Vía Láctea: banda inclinada de ruido fractal con nubes de polvo oscuro y un núcleo más cálido.
 * - Paralaje leve con el scroll y dithering para que el degradé no haga escalones.
 * Sin WebGL2 queda el degradé CSS del contenedor.
 */
const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform float uDpr;
out vec4 outColor;

float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p+n)); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), u.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<6;i++){ v += a*noise(p); p = p*2.03 + 17.1; a *= 0.5; } return v; }

// temperatura de color aproximada (azul-blanco-amarillo-naranja)
vec3 starColor(float t){
  vec3 hot = vec3(0.68, 0.80, 1.0), sun = vec3(1.0, 0.96, 0.88), cool = vec3(1.0, 0.72, 0.48);
  return t < 0.5 ? mix(hot, sun, t*2.0) : mix(sun, cool, (t-0.5)*2.0);
}

vec3 starLayer(vec2 uv, float cell, float density, float seed, float tw){
  vec2 g = uv / cell;
  vec2 id = floor(g), f = fract(g);
  vec3 col = vec3(0.0);
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 o = vec2(x,y);
    vec2 cid = id + o + seed;
    float present = step(1.0 - density, h21(cid*1.7));
    if(present < 0.5) continue;
    vec2 pos = o + h22(cid);
    float d = length((f - pos) * cell) * uRes.y / uDpr;  // distancia en px CSS
    float r = h21(cid*3.1);
    float mag = pow(r, 9.0);                              // cola larga: pocas brillantes
    float core = exp(-d*d / (0.35 + mag*1.6));
    float halo = exp(-d / (1.0 + mag*6.0)) * mag * 0.4;
    float twinkle = 1.0 - tw*(0.5 + 0.5*sin(uTime*(0.6 + r*2.4) + r*40.0));
    col += starColor(h21(cid*5.3)) * (core*(0.12 + mag*2.2) + halo) * twinkle;
  }
  return col;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes.y;
  vec3 col = vec3(0.012, 0.018, 0.034);

  // Vía Láctea: banda diagonal con polvo
  vec2 c = uv - vec2(0.5*uRes.x/uRes.y, 0.5) + vec2(0.0, uScroll*0.04);
  float ang = -0.55;
  vec2 r = vec2(cos(ang)*c.x - sin(ang)*c.y, sin(ang)*c.x + cos(ang)*c.y);
  float band = exp(-pow(r.y*2.6 + 0.08*sin(r.x*2.0), 2.0));
  float gas = fbm(r*vec2(2.2, 5.0) + vec2(uTime*0.004, 0.0));
  float dust = smoothstep(0.45, 0.8, fbm(r*vec2(3.0, 9.0) + 9.0));
  float glow = band * (0.35 + 0.65*gas) * (1.0 - 0.75*dust*band);
  float core = exp(-pow(r.x*1.4 - 0.25, 2.0)) * band;
  col += glow * mix(vec3(0.10, 0.13, 0.24), vec3(0.30, 0.24, 0.20), core) * 0.7;
  // estrellas finas dentro de la banda
  col += starLayer(uv + vec2(0.0, uScroll*0.03), 0.012, 0.35*band, 7.0, 0.15) * band * 0.6;

  // tres capas de estrellas con paralaje
  col += starLayer(uv + vec2(0.0, uScroll*0.02), 0.024, 0.16, 1.0, 0.25);
  col += starLayer(uv + vec2(0.0, uScroll*0.05), 0.05, 0.10, 2.0, 0.35);
  col += starLayer(uv + vec2(0.0, uScroll*0.09), 0.10, 0.07, 3.0, 0.45);

  // menos estrellas detrás del texto de la izquierda, para que se lea
  col *= mix(0.55, 1.0, smoothstep(0.15, 0.55, frag.x/uRes.x));
  // resplandor frío arriba a la derecha (donde va el globo) y viñeta
  col += vec3(0.02, 0.07, 0.10) * exp(-length(uv - vec2(0.78*uRes.x/uRes.y, 0.95))*1.6);
  vec2 q = frag/uRes - 0.5;
  col *= 1.0 - dot(q,q)*0.9;

  // dithering contra el banding
  col += (h21(frag + uTime) - 0.5) / 255.0;
  outColor = vec4(col, 1.0);
}`;

const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

export function NightSky() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
    } catch (e) {
      console.warn("[cielo] sin shader:", e);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "uRes"), uTime = gl.getUniformLocation(prog, "uTime");
    const uScroll = gl.getUniformLocation(prog, "uScroll"), uDpr = gl.getUniformLocation(prog, "uDpr");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0, last = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden || now - last < 33) return; // ~30 fps alcanza para un cielo
      last = now;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduce ? 0 : (now - t0) / 1000);
      gl.uniform1f(uScroll, window.scrollY / window.innerHeight);
      gl.uniform1f(uDpr, dpr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(120%_80%_at_80%_0%,#0b1a2a_0%,#05080f_60%,#03050a_100%)]">
      <canvas ref={ref} className="h-full w-full" />
    </div>
  );
}
