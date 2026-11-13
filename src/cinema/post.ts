import * as THREE from "three";

export type PortalPath = { from: [number, number]; rot: number; scale: number };

const frag = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tA;
uniform sampler2D tB;
uniform float uT;
uniform vec2 uCenter;
uniform float uScale;
uniform float uRot;
uniform float uAspect;
uniform float uTime;
uniform float uGlitch;
uniform float uBarrel;
uniform vec2 uRes;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(float x) { float i = floor(x); float f = fract(x); return mix(hash(vec2(i, 0.)), hash(vec2(i + 1., 0.)), f * f * (3. - 2. * f)); }

float sdRoundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }

vec3 scene(vec2 uv) {
  vec3 a = texture2D(tA, clamp(uv, 0.001, 0.999)).rgb;
  if (uT <= 0.0) return a;
  vec2 p = uv - 0.5; p.x *= uAspect;
  float c = cos(-uRot), s = sin(-uRot);
  p = mat2(c, -s, s, c) * (p - uCenter);
  vec2 half_ = vec2(0.5 * uAspect, 0.5) * uScale;
  float d = sdRoundBox(p, half_, 0.035 * uScale + 0.004);
  vec2 luv = p / (half_ * 2.0) + 0.5;
  vec2 cc = luv - 0.5;
  luv = 0.5 + cc * (1.0 - (1.0 - uT) * 0.12 * dot(cc, cc));
  vec3 b = texture2D(tB, clamp(luv, 0.001, 0.999)).rgb;
  float inside = 1.0 - smoothstep(-0.0015, 0.0015, d);
  float rim = (1.0 - smoothstep(0.0, 0.004, abs(d))) * (1.0 - uT);
  float shadow = (1.0 - smoothstep(0.0, 0.08, d)) * (1.0 - inside) * 0.35 * (1.0 - uT);
  vec3 col = mix(a * (1.0 - shadow), b, inside);
  return mix(col, vec3(1.0), rim * 0.6);
}

vec3 toSRGB(vec3 c) { c = clamp(c, 0., 1.); return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - 0.055, step(0.0031308, c)); }

void main() {
  vec2 uv = vUv;
  vec2 cc = uv - 0.5;
  float r2 = dot(cc, cc);
  uv = 0.5 + cc * (1.0 + uBarrel * r2) / (1.0 + uBarrel * 0.25);

  float t = uTime;
  float g = uGlitch;
  float band = 0.0;
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float y0 = fract(t * (0.05 + fk * 0.031) + fk * 0.37);
    float w = 0.012 + 0.03 * noise(t * 0.7 + fk * 3.1);
    float m = smoothstep(w, 0.0, abs(uv.y - y0));
    band += m * (0.25 + 0.75 * step(0.6, noise(t * 1.3 + fk * 7.0)));
  }
  float jitter = (hash(vec2(floor(uv.y * uRes.y / 2.0), floor(t * 30.0))) - 0.5);
  float amp = 0.0025 + 0.03 * g;
  uv.x += band * jitter * amp * 4.0 + jitter * 0.0006 * (1.0 + 8.0 * g);
  float tear = step(0.92 - 0.25 * g, hash(vec2(floor(uv.y * 24.0), floor(t * 12.0)))) * g;
  uv.x += tear * (hash(vec2(floor(uv.y * 24.0), floor(t * 12.0) + 3.0)) - 0.5) * 0.12;

  vec2 dir = (uv - 0.5) * (0.004 + 0.012 * g + 0.01 * band);
  vec3 col;
  col.r = scene(uv + dir).r;
  col.g = scene(uv).g;
  col.b = scene(uv - dir).b;

  col = toSRGB(col);
  col += band * 0.06;
  float scan = 0.94 + 0.06 * sin(vUv.y * uRes.y * 1.6);
  col *= scan;
  float gr = hash(vUv * uRes + fract(t) * 91.7) - 0.5;
  col += gr * 0.07;
  vec2 dp = vec2(floor(vUv.y * uRes.y / 2.0), floor(t * 14.0));
  float drop = step(0.9985 - 0.004 * g, hash(dp));
  float dx = hash(dp + 1.7);
  drop *= step(dx, vUv.x) * step(vUv.x, dx + 0.015 + 0.05 * hash(dp + 4.2));
  col = mix(col, vec3(0.95), drop * 0.85);
  float vig = smoothstep(0.95, 0.25, length((vUv - 0.5) * vec2(1.0, 1.15)));
  col *= mix(0.55, 1.0, vig);
  gl_FragColor = vec4(col, 1.0);
}
`;

export function createPost() {
  const mat = new THREE.ShaderMaterial({
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }",
    fragmentShader: frag,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tA: { value: null }, tB: { value: null },
      uT: { value: 0 }, uCenter: { value: new THREE.Vector2() }, uScale: { value: 1 }, uRot: { value: 0 },
      uAspect: { value: 1 }, uTime: { value: 0 }, uGlitch: { value: 0 }, uBarrel: { value: 0.18 },
      uRes: { value: new THREE.Vector2(1, 1) },
    },
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.Camera();

  function setPortal(t: number, path: PortalPath, aspect: number) {
    const u = mat.uniforms;
    u.uT.value = t;
    const e = t < 0.5 ? 0.5 * Math.pow(t * 2, 1.6) : 1 - 0.5 * Math.pow((1 - t) * 2, 3);
    u.uScale.value = path.scale + (1 - path.scale) * e;
    u.uRot.value = path.rot * (1 - e);
    u.uCenter.value.set(path.from[0] * aspect * (1 - e), path.from[1] * (1 - e));
  }

  return { scene, camera, mat, setPortal, dispose: () => { geo.dispose(); mat.dispose(); } };
}
