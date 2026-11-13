import * as THREE from "three";
import type { Project } from "../data";
import { createScreenTexture, SW, SH } from "../screens";
import { crtGeometry, crtMaterial } from "../crt";
import { disposeScene, type Chapter, type Ctx } from "./types";
import { config } from "../../config";

const SPACING = 2.6;

function terminalFloorTexture() {
  const cv = document.createElement("canvas");
  cv.width = 2048; cv.height = 1024;
  const g = cv.getContext("2d")!;
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = "#00000022";
  g.font = "600 34px ui-monospace, Menlo, monospace";
  const lines = [
    "Ubuntu 24.04.2 LTS studio tty1", "", `studio login: ${config.person.handle}`, "Password:",
    "Last login: Thu Nov 12 03:44:12 IST 2026 on tty1",
    ` * Documentation:  ${config.site.url}`, ` * Source:         https://github.com/${config.accounts.github}`,
    `${config.person.handle}@studio:~$ git push origin main`, "Enumerating objects: 42, done.",
    `${config.person.handle}@studio:~$ docker compose up -d`, "✔ Container api      Started",
    "✔ Container worker   Started", `${config.person.handle}@studio:~$ echo "ship it"`, "ship it", `${config.person.handle}@studio:~$ _`,
  ];
  lines.forEach((l, i) => g.fillText(l, 40, 60 + i * 62));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(3, 1);
  return tex;
}

export function createWork(ctx: Ctx, projects: Project[]): Chapter {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f4f4f2");
  scene.fog = new THREE.Fog("#f4f4f2", 4, 13);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

  const rail = new THREE.Group();
  rail.rotation.set(0.12, -0.32, -0.5);
  scene.add(rail);

  const geo = crtGeometry();

  const screens = projects.map((p, i) => {
    const st = createScreenTexture(p);
    st.draw(0);
    const { material, uniforms: u } = crtMaterial(st.tex, SW / SH);
    const mesh = new THREE.Mesh(geo, material);
    const holder = new THREE.Group();
    holder.position.set(i * SPACING, 0, 0);
    holder.rotation.z = 0.5 - 0.06;
    holder.add(mesh);
    const bezel = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 1.08), new THREE.MeshBasicMaterial({ color: "#0b0b0b" }));
    bezel.position.z = -0.012;
    holder.add(bezel);
    rail.add(holder);
    return { st, u, holder, aspect: SW / SH };
  });

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(SPACING * projects.length + 12, 6),
    new THREE.MeshBasicMaterial({ map: terminalFloorTexture(), transparent: true, opacity: 0.9 }),
  );
  floor.rotation.set(-1.25, 0, 0.5);
  floor.position.set((SPACING * (projects.length - 1)) / 2, -1.05, -0.6);
  rail.add(floor);

  const target = new THREE.Vector3();
  const camLocal = new THREE.Vector3();
  let f = 0;
  let lastDraw = 0;

  return {
    scene, camera,
    update(lp, time, dt, mouse) {
      f += (workFocus(lp, projects.length) - f) * (1 - Math.exp(-5 * dt));

      camLocal.set(f * SPACING, 0.02, 2.85 * Math.max(1, 1.15 / camera.aspect));
      camera.position.copy(rail.localToWorld(camLocal.clone()));
      camera.position.x += mouse.x * 0.08;
      camera.position.y += mouse.y * 0.05;
      target.copy(rail.localToWorld(new THREE.Vector3(f * SPACING, 0, 0)));
      if (camera.aspect < 1) { camera.position.y -= 0.9; target.y -= 0.9; }
      camera.lookAt(target);

      const redraw = time - lastDraw > 1 / 30;
      if (redraw) lastDraw = time;
      screens.forEach((s, i) => {
        const dist = Math.abs(i - f);
        s.u.uFocus.value = Math.max(0, 1 - dist * 1.4);
        s.u.uTime.value = time;
        s.u.uGlitch.value = Math.min(1, Math.abs(dist - Math.round(dist)) * 3) * (dist < 1.2 ? 1 : 0);
        if (redraw && dist < 1.3) s.st.draw(time);
      });
    },
    dispose: () => disposeScene(scene),
  };
}

function smoothstepN(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function workFocus(lp: number, n: number) {
  const raw = Math.min(0.999, lp / 0.93) * n - 0.5;
  const base = Math.max(0, Math.floor(raw));
  const frac = Math.max(0, raw - base);
  return Math.min(n - 1, base + smoothstepN(0.55, 1, frac));
}
