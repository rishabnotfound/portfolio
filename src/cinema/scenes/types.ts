import type * as THREE from "three";

export type Ctx = { mobile: boolean; reduced: boolean };

export type Chapter = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update(lp: number, time: number, dt: number, mouse: THREE.Vector2): void;
  dispose(): void;
};

export function disposeScene(scene: THREE.Object3D) {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    m.geometry?.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
      Object.values(x).forEach((v) => (v as THREE.Texture)?.isTexture && (v as THREE.Texture).dispose());
      const u = (x as THREE.ShaderMaterial).uniforms;
      if (u) Object.values(u).forEach((v) => (v.value as THREE.Texture)?.isTexture && (v.value as THREE.Texture).dispose());
      x.dispose();
    });
  });
}
