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
  vec3 c = texture2D(map, vUv).rgb;
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
