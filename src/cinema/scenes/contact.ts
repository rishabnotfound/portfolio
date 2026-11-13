import * as THREE from "three";
import { disposeScene, type Chapter } from "./types";

const frag = `
varying vec2 vUv;
uniform float uTime; uniform float uAspect; uniform vec2 uMouse; uniform float uZoom;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }

vec3 wall(vec2 q, float side){
  vec3 c = vec3(0.022, 0.003, 0.002) * (0.6 + 0.8 * noise(q * vec2(3.0, 9.0)));
  vec2 cell = floor(q * vec2(4.0, 2.5));
  vec2 f = fract(q * vec2(4.0, 2.5));
  float h = hash(cell + side * 13.0);
  float box = step(0.18, f.x) * step(f.x, 0.82) * step(0.2, f.y) * step(f.y, 0.8) * step(0.55, h);
  vec3 tint = mix(vec3(0.9, 0.06, 0.01), vec3(1.0, 0.35, 0.04), hash(cell + 3.0));
  vec2 gq = f * vec2(7.0, 4.0);
  float glyph = step(0.5, hash(floor(gq * vec2(2.0, 3.0)) + cell * 9.0)) * step(0.25, fract(gq.x)) * step(0.2, fract(gq.y));
  float pulse = 0.85 + 0.15 * sin(uTime * 2.0 + h * 20.0);
  c = mix(c, tint * 0.08, box);
  c += tint * glyph * box * 0.9 * pulse;
  float rim = box * (1.0 - step(0.2 + 0.02, f.y) * step(f.y, 0.8 - 0.02) * step(0.18 + 0.02, f.x) * step(f.x, 0.82 - 0.02));
  c += vec3(1.0, 0.2, 0.08) * rim * step(0.75, h) * 1.2;
  c *= 0.8 + 0.2 * step(0.5, fract(q.y * 60.0));
  return c;
}

void main(){
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) / uZoom + uMouse * 0.04;
  vec3 col = vec3(0.0);
  float ax = abs(p.x);
  float vy = 0.08;
  float wallStart = 0.18 + max(0.0, p.y - vy) * 0.25;
  if (ax > wallStart) {
    float depth = 0.05 / max(0.001, ax - 0.13);
    vec2 q = vec2(depth + uTime * 0.02, (p.y - vy) / max(0.05, ax) * 0.7);
    col = wall(q, sign(p.x));
    col *= smoothstep(0.0, 0.5, ax);
  } else {
    float g = max(0.0, 1.0 - length((p - vec2(0.0, vy)) * vec2(2.2, 3.2)));
    col = vec3(0.05, 0.006, 0.003) + vec3(0.9, 0.22, 0.04) * pow(g, 4.0) * 0.5;
  }
  col *= mix(1.0, 0.25, smoothstep(0.32, 0.5, p.y));
  if (p.y < -0.22) {
    float r = noise(vec2(p.x * 20.0, p.y * 80.0 + uTime * 0.6));
    col = col * 0.25 + vec3(0.3, 0.04, 0.01) * r * 0.2 * (1.0 - smoothstep(0.0, 0.5, ax));
  }
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    vec2 c = vec2(0.32 + fi * 0.09, 0.28 - fi * 0.015 + sin(uTime * 0.9 + fi) * 0.006);
    float rad = 0.055 - fi * 0.006;
    vec2 d = (p - c) / vec2(rad * 0.8, rad);
    float l = length(d);
    vec3 lc = i == 0 ? vec3(1.0, 0.12, 0.05) : mix(vec3(1.0, 0.9, 0.75), vec3(1.0, 0.25, 0.1), hash(vec2(fi)));
    col = mix(col, lc * (0.6 - l * 0.3) * (0.9 + 0.1 * step(0.5, fract(d.y * 4.0))), smoothstep(1.0, 0.95, l));
    col += lc * pow(max(0.0, 1.0 - l * 0.35), 4.0) * 0.12;
  }
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    vec2 c = vec2(hash(vec2(fi, 1.0)) - 0.5, hash(vec2(fi, 2.0)) * 0.7 - 0.2) * vec2(uAspect, 1.0);
    c.y += sin(uTime * 0.3 + fi) * 0.01;
    float b = smoothstep(0.035, 0.03, length(p - c)) * 0.12;
    col += vec3(0.5, 0.15, 0.04) * b;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export function createContact(): Chapter {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
  const uniforms = { uTime: { value: 0 }, uAspect: { value: 1 }, uMouse: { value: new THREE.Vector2() }, uZoom: { value: 1 } };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms, fragmentShader: frag, depthTest: false,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }",
  }));
  quad.frustumCulled = false;
  scene.add(quad);
  const m = new THREE.Vector2();
  return {
    scene, camera,
    update(lp, time, dt, mouse) {
      m.lerp(mouse, 1 - Math.exp(-3 * dt));
      uniforms.uTime.value = time;
      uniforms.uAspect.value = camera.aspect;
      uniforms.uMouse.value.copy(m);
      uniforms.uZoom.value = 1 + lp * 0.15;
    },
    dispose: () => disposeScene(scene),
  };
}
