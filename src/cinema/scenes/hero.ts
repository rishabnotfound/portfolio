import * as THREE from "three";
import { disposeScene, type Chapter, type Ctx } from "./types";
import { config } from "../../config";

const gridFrag = `
varying vec2 vUv;
uniform float uTime;
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
float line(vec2 g, float w){ vec2 f = abs(fract(g) - 0.5); return smoothstep(0.5 - w, 0.5, max(f.x, f.y)); }
void main(){
  vec2 g = vUv * vec2(26.0, 16.0);
  float d = length((vUv - vec2(0.5, 0.48)) * vec2(1.6, 1.0));
  float l = line(g, 0.035);
  float s1 = step(hash(floor(g)), 1.1 - d * 2.2);
  l = max(l, s1 * line(g * 2.0, 0.06));
  float s2 = s1 * step(hash(floor(g * 2.0) + 7.0), 0.9 - d * 2.8);
  l = max(l, s2 * line(g * 4.0, 0.1));
  float flick = 0.85 + 0.15 * step(0.5, hash(vec2(floor(uTime * 8.0), floor(g.y))));
  gl_FragColor = vec4(vec3(0.72, 0.76, 0.8) * l * flick * 0.55, 1.0);
}`;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

export async function createHero(ctx: Ctx): Promise<Chapter> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#000000");
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  const gridU = { uTime: { value: 0 } };
  const grid = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 11, 64, 1, true, Math.PI - 0.85, 1.7),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, uniforms: gridU,
      vertexShader: "varying vec2 vUv; void main(){ vUv = vec2(1.0 - uv.x, uv.y); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
      fragmentShader: gridFrag,
    }),
  );
  grid.position.z = 6.5;
  scene.add(grid);

  const N = ctx.mobile ? 72 : 112;
  const img = await loadImage(config.person.avatar);
  const cv = document.createElement("canvas");
  cv.width = cv.height = N;
  const c2 = cv.getContext("2d", { willReadFrequently: true })!;
  c2.drawImage(img, 0, 0, N, N);
  const px = c2.getImageData(0, 0, N, N).data;

  const size = 3.4 / N;
  const box = new THREE.BoxGeometry(size * 0.9, size * 0.9, 1);
  box.translate(0, 0, 0.5);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1 });
  const voxels = new THREE.InstancedMesh(box, mat, N * N);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  let n = 0;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const k = (y * N + x) * 4;
      const lum = (px[k] * 0.3 + px[k + 1] * 0.59 + px[k + 2] * 0.11) / 255;
      const u = x / N - 0.5, v = 0.5 - y / N;
      const r = Math.hypot(u / 0.46, (v + 0.02) / 0.52);
      if (r > 1 || (r > 0.82 && Math.random() < (r - 0.82) * 5)) continue;
      const dome = Math.sqrt(Math.max(0, 1 - r * r));
      const depth = 0.08 + dome * 0.75 + (lum < 0.35 ? -0.06 : lum * 0.1);
      m4.makeScale(1, 1, depth).setPosition(u * N * size, v * N * size, 0);
      voxels.setMatrixAt(n, m4);
      const b = lum < 0.35 ? 0.06 : 0.55 + lum * 0.45;
      voxels.setColorAt(n, col.setRGB(b * 0.82, b * 0.92, b));
      n++;
    }
  }
  voxels.count = n;
  voxels.instanceMatrix.needsUpdate = true;
  if (voxels.instanceColor) voxels.instanceColor.needsUpdate = true;
  const head = new THREE.Group();
  head.add(voxels);
  head.position.set(0, -0.15, 0);
  scene.add(head);

  const key = new THREE.DirectionalLight("#cfe6ff", 3.2);
  key.position.set(4, 1.5, 3);
  const rim = new THREE.DirectionalLight("#3f6bff", 0.9);
  rim.position.set(-4, 2, -1);
  scene.add(key, rim, new THREE.AmbientLight("#ffffff", 0.06));

  let rx = 0, ry = 0;
  return {
    scene, camera,
    update(lp, time, dt, mouse) {
      const k = 1 - Math.exp(-4 * dt);
      ry += (mouse.x * 0.35 - ry) * k;
      rx += (-mouse.y * 0.2 - rx) * k;
      head.rotation.set(rx, ry + (ctx.reduced ? 0 : Math.sin(time * 0.3) * 0.05), 0);
      key.position.x = 4 - lp * 6;
      camera.position.z = (7 - lp * 1.8) * Math.max(1, 1 / camera.aspect);
      gridU.uTime.value = time;
    },
    dispose: () => disposeScene(scene),
  };
}
