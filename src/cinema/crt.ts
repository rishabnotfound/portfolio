import * as THREE from "three";

const frag = `
varying vec2 vUv;
uniform sampler2D map;
uniform float uTime;
uniform float uFocus;
uniform float uGlitch;
uniform float uAspect;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float sdRoundBox(vec2 p, vec2 b, float r){  vec2 q = abs(p) - b + r; return length(max(q,0.)) + min(max(q.x,q.y),0.) - r; }
void main(){
  vec2 p = vUv - 0.5;
  float d = sdRoundBox(p * vec2(uAspect, 1.0), vec2(0.5 * uAspect, 0.5), 0.06);
  if (d > 0.0) discard;
  vec2 uv = vUv;
  float row = floor(uv.y * 90.0);
  float g = uGlitch * step(0.75, hash(vec2(row, floor(uTime * 20.0))));
  uv.x += g * (hash(vec2(row, floor(uTime * 20.0) + 1.0)) - 0.5) * 0.15;
  vec3 c = texture2D(map, uv).rgb;
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(lum), c, 0.35 + 0.65 * uFocus);
  c *= 0.97 + 0.03 * sin(vUv.y * 900.0);
  float edge = smoothstep(-0.05, 0.0, d);
  c *= 1.0 - edge * 0.6;
  c += pow(max(0.0, 1.0 - length(p - vec2(-0.18, 0.22)) * 2.2), 3.0) * 0.12;
  gl_FragColor = vec4(c, 1.0);
}`;

export function crtGeometry(w = 1.6, h = 1.0) {
  const geo = new THREE.PlaneGeometry(w, h, 48, 30);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / (w / 2), y = pos.getY(i) / (h / 2);
    pos.setZ(i, 0.09 * (h / 1.0) * (1 - x * x * 0.8) * (1 - y * y * 0.8));
  }
  geo.computeVertexNormals();
  return geo;
}

export function crtMaterial(map: THREE.Texture, aspect: number) {
  const uniforms = {
    map: { value: map }, uTime: { value: 0 }, uFocus: { value: 1 }, uGlitch: { value: 0 }, uAspect: { value: aspect },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, fragmentShader: frag,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
  });
  return { material, uniforms };
}
