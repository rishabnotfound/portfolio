import * as THREE from "three";
import type { Project } from "./data";

export const SW = 1024, SH = 640;
const SANS = '"Helvetica Neue", Arial, sans-serif';
const MONO = 'ui-monospace, Menlo, Consolas, monospace';

type Paint = (g: CanvasRenderingContext2D, t: number) => void;

const rnd = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.roundRect(x, y, w, h, r);
}

function chrome(g: CanvasRenderingContext2D, label: string, dark: boolean) {
  g.fillStyle = dark ? "#ffffff80" : "#00000080";
  g.font = `600 13px ${MONO}`;
  g.fillText(label, 34, 36);
  g.textAlign = "right";
  g.fillText("DOCS   GITHUB   ●", SW - 34, 36);
  g.textAlign = "left";
}

const layla: Paint = (g, t) => {
  const bg = g.createLinearGradient(0, 0, 0, SH);
  bg.addColorStop(0, "#0b2cff"); bg.addColorStop(1, "#74c7ff");
  g.fillStyle = bg; g.fillRect(0, 0, SW, SH);
  chrome(g, "LAYLA", true);
  g.fillStyle = "#fff";
  g.font = `italic 800 92px ${SANS}`;
  g.fillText("Layla", 56, 190);
  g.font = `500 22px ${SANS}`;
  g.fillStyle = "#ffffffcc";
  ["Free web-push for the open web.", "150–200 sites · ~470k subscribers"].forEach((s, i) => g.fillText(s, 60, 240 + i * 32));
  const sent = 292100 + Math.floor(t * 37) % 9000;
  g.font = `700 54px ${MONO}`; g.fillStyle = "#fff";
  g.fillText(sent.toLocaleString("en-US"), 56, 560);
  g.font = `600 14px ${MONO}`; g.fillStyle = "#ffffffb0";
  g.fillText("NOTIFICATIONS DELIVERED", 60, 590);
  const msgs = ["New episode is live", "Your build passed ✓", "Price drop: -40%", "3 new replies", "Deploy finished", "Stream starting now"];
  const cyc = t * 0.7;
  for (let k = 0; k < 4; k++) {
    const idx = Math.floor(cyc) - k;
    const f = k === 0 ? Math.min(1, (cyc % 1) * 2.5) : 1;
    const y = 120 + k * 112 + (1 - f) * -40;
    g.globalAlpha = (k === 0 ? f : 1) * (1 - k * 0.18);
    g.fillStyle = "#ffffff"; rr(g, 560, y, 410, 92, 18); g.fill();
    g.fillStyle = "#0b2cff"; g.beginPath(); g.arc(606, y + 46, 22, 0, 7); g.fill();
    g.fillStyle = "#0a0a0a"; g.font = `700 20px ${SANS}`;
    g.fillText(msgs[((idx % 6) + 6) % 6], 646, y + 40);
    g.fillStyle = "#666"; g.font = `400 16px ${SANS}`;
    g.fillText(`site-${((idx * 7) % 57 + 57) % 57 + 1}.com · now`, 646, y + 66);
  }
  g.globalAlpha = 1;
};

const syella: Paint = (g, t) => {
  g.fillStyle = "#0b0b0d"; g.fillRect(0, 0, SW, SH);
  g.fillStyle = "#16161a"; g.fillRect(0, 0, SW, 64);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(34 + i * 24, 32, 7, 0, 7); g.fill(); });
  ["prod-01", "edge-sg", "nept-db", "+"].forEach((s, i) => {
    g.fillStyle = i === 0 ? "#0b0b0d" : "#202026"; rr(g, 120 + i * 150, 14, 140, 50, 10); g.fill();
    g.fillStyle = i === 0 ? "#fff" : "#888"; g.font = `500 15px ${MONO}`; g.fillText(s, 140 + i * 150, 46);
  });
  const lines = [
    ["$ ", "ssh root@prod-01.nept.cloud"],
    ["", "Welcome to Ubuntu 24.04 LTS · load 0.21"],
    ["$ ", "docker ps --format '{{.Names}}'"],
    ["", "layla-api   layla-worker   redis   nginx"],
    ["$ ", "htop"],
    ["", "CPU ▇▇▇▅▃▂  MEM 2.1G/8G  UP 41d"],
    ["$ ", "tail -f /var/log/nginx/access.log"],
  ];
  const typed = (t * 22) % 260;
  let budget = typed;
  g.font = `500 21px ${MONO}`;
  lines.forEach(([p, s], i) => {
    if (budget <= 0) return;
    const shown = s.slice(0, Math.max(0, Math.floor(budget)));
    budget -= s.length + 6;
    g.fillStyle = "#adfaa7"; g.fillText(p, 40, 120 + i * 40);
    g.fillStyle = p ? "#f2f2f2" : "#8a8a95"; g.fillText(shown, 40 + (p ? 26 : 0), 120 + i * 40);
  });
  if (Math.floor(t * 2) % 2) { g.fillStyle = "#f2f2f2"; g.fillRect(40, 120 + 7 * 40 - 18, 12, 22); }
  g.strokeStyle = "#ffffff"; g.lineWidth = 2;
  g.font = `900 150px ${SANS}`;
  g.strokeText("SYELLA", 330, 600);
};

const makima: Paint = (g, t) => {
  g.fillStyle = "#120003"; g.fillRect(0, 0, SW, SH);
  const glow = g.createRadialGradient(780, 300, 20, 780, 300, 420);
  glow.addColorStop(0, "#c4001d"); glow.addColorStop(1, "#12000300");
  g.fillStyle = glow; g.fillRect(0, 0, SW, SH);
  chrome(g, "MAKIMAKEY", true);
  g.fillStyle = "#fff"; g.font = `900 64px ${SANS}`;
  g.fillText("MakimaKey", 56, 150);
  g.font = `500 18px ${MONO}`; g.fillStyle = "#ffffffa0";
  g.fillText("OFFLINE · E2E ENCRYPTED · ZERO NETWORK", 58, 186);
  const step = Math.floor(t / 30);
  const left = 30 - (t % 30);
  const code = (s: number) => String(Math.floor(rnd(s) * 1e6)).padStart(6, "0");
  const main = code(step);
  g.font = `700 120px ${MONO}`; g.fillStyle = "#fff";
  g.fillText(`${main.slice(0, 3)} ${main.slice(3)}`, 56, 360);
  g.strokeStyle = "#ffffff30"; g.lineWidth = 10;
  g.beginPath(); g.arc(780, 300, 110, 0, 7); g.stroke();
  g.strokeStyle = left < 6 ? "#ff3b4a" : "#ffffff"; g.lineCap = "round";
  g.beginPath(); g.arc(780, 300, 110, -Math.PI / 2, -Math.PI / 2 + (left / 30) * Math.PI * 2); g.stroke();
  g.font = `700 64px ${MONO}`; g.textAlign = "center"; g.fillStyle = "#fff";
  g.fillText(String(Math.ceil(left)), 780, 322); g.textAlign = "left";
  ["GITHUB", "DISCORD", "NEPT CLOUD"].forEach((s, i) => {
    g.fillStyle = "#ffffff12"; rr(g, 56, 430 + i * 62, 520, 50, 10); g.fill();
    g.fillStyle = "#ffffffb0"; g.font = `600 16px ${MONO}`; g.fillText(s, 76, 461 + i * 62);
    g.fillStyle = "#fff"; g.font = `700 22px ${MONO}`; g.fillText(code(step * 3 + i + 9), 430, 463 + i * 62);
  });
};

const delta: Paint = (g, t) => {
  g.fillStyle = "#d7d8d6"; g.fillRect(0, 0, SW, SH);
  chrome(g, "DELTASYS", false);
  g.fillStyle = "#0a0a0a"; g.font = `900 112px ${SANS}`;
  g.save(); g.scale(0.8, 1); g.fillText("DELTA", 60 / 0.8, 180); g.fillText("SYS", 60 / 0.8, 286); g.restore();
  const panels = [["CPU", 0.6, "#0a0a0a"], ["MEM", 0.35, "#444"], ["NET", 1.4, "#0a0a0a"]] as const;
  panels.forEach(([label, sp, c], i) => {
    const x = 470, y = 80 + i * 170, w = 500, h = 140;
    g.fillStyle = "#c8c9c7"; rr(g, x, y, w, h, 12); g.fill();
    g.fillStyle = "#0a0a0a"; g.font = `700 15px ${MONO}`; g.fillText(label, x + 18, y + 28);
    g.strokeStyle = c; g.lineWidth = 2.5; g.beginPath();
    for (let k = 0; k <= 60; k++) {
      const v = 0.5 + 0.28 * Math.sin(k * 0.35 + t * sp * 3 + i) + 0.18 * Math.sin(k * 1.3 - t * 2 * sp);
      const px = x + 18 + (k / 60) * (w - 36), py = y + h - 16 - v * (h - 56);
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke();
    const val = Math.round(40 + 35 * Math.sin(t * sp + i));
    g.textAlign = "right"; g.fillText(`${val}%`, x + w - 18, y + 28); g.textAlign = "left";
  });
  ["prod-01  ● 41d", "edge-sg  ● 12d", "nept-db  ● 90d"].forEach((s, i) => {
    g.fillStyle = "#0a0a0a"; g.font = `600 17px ${MONO}`; g.fillText(s, 64, 400 + i * 40);
  });
  g.fillStyle = "#0a0a0a"; rr(g, 60, 530, 200, 52, 26); g.fill();
  g.fillStyle = "#fff"; g.font = `700 16px ${MONO}`; g.fillText("OPEN SHELL →", 92, 562);
};

const GLYPHS: Record<string, string[]> = {
  R: ["110", "101", "110", "101", "101"], I: ["111", "010", "010", "010", "111"],
  S: ["011", "100", "010", "001", "110"], H: ["101", "101", "111", "101", "101"],
  A: ["010", "101", "111", "101", "101"], B: ["110", "101", "110", "101", "110"],
};
const RISHAB = [0, 1, 2, 3, 4].map((r) => [..."RISHAB"].map((c) => GLYPHS[c][r]).join("0"));

const commit: Paint = (g, t) => {
  g.fillStyle = "#050505"; g.fillRect(0, 0, SW, SH);
  const cols = 52, rows = 7, s = 15, gap = 3.6, ox = 40, oy = 300;
  const head = (t * 9) % (cols + 20);
  for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
    const tx = x - 14, ty = y - 1;
    const on = tx >= 0 && ty >= 0 && ty < 5 && tx < RISHAB[0].length && RISHAB[ty][tx] === "1" && x < head;
    const lvl = on ? 4 : Math.floor(rnd(x * 7 + y) * 2.2);
    g.fillStyle = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"][lvl];
    rr(g, ox + x * (s + gap), oy + y * (s + gap), s, s, 3); g.fill();
  }
  g.fillStyle = "#ffe600"; g.font = `900 132px ${SANS}`;
  g.fillText("COMMITIFY", 36, 200);
  g.fillStyle = "#ffffff90"; g.font = `500 16px ${MONO}`;
  g.fillText(`$ commitify paint --text "RISHAB" --year 2026   ▸ ${Math.floor(head * 13)} commits scheduled`, 40, 470);
  g.fillStyle = "#ffffff40"; g.fillText("CHAOTIC GOOD CONTRIBUTION GRAPHS SINCE 2024", 40, 600);
};

const PAINTERS: Record<string, Paint> = { layla, syella, makimakey: makima, deltasys: delta, commitify: commit };

const SCHEMES = [
  { bg: "#0b2cff", fg: "#ffffff", dim: "#ffffffaa", chip: "#ffffff22" },
  { bg: "#d7d8d6", fg: "#0a0a0a", dim: "#0a0a0a99", chip: "#0a0a0a14" },
  { bg: "#0a0a0a", fg: "#ffe600", dim: "#ffffff99", chip: "#ffffff18" },
  { bg: "#120003", fg: "#ffffff", dim: "#ffffffa0", chip: "#ff3b4a33" },
  { bg: "#06140b", fg: "#adfaa7", dim: "#adfaa7a0", chip: "#adfaa722" },
];

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) {
  const words = text.split(/\s+/);
  let line = "", n = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y + n * lh); line = w;
      if (++n >= maxLines) return;
    } else line = test;
  }
  if (line) g.fillText(line, x, y + n * lh);
}

function generic(p: Project): Paint {
  const scheme = SCHEMES[[...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) % SCHEMES.length];
  const topics = p.tag.split(" · ").filter(Boolean);
  return (g, t) => {
    g.fillStyle = scheme.bg; g.fillRect(0, 0, SW, SH);
    g.fillStyle = scheme.dim; g.font = `600 13px ${MONO}`;
    g.fillText(p.name, 34, 36);
    g.textAlign = "right"; g.fillText(`★ ${p.stars ?? 0}   ${p.lang ?? ""}`.toUpperCase(), SW - 34, 36); g.textAlign = "left";
    g.fillStyle = scheme.fg;
    let size = 150;
    g.font = `900 ${size}px ${SANS}`;
    while (g.measureText(p.name).width > SW * 0.62 && size > 56) { size -= 6; g.font = `900 ${size}px ${SANS}`; }
    g.fillText(p.name, 46, 110 + size * 0.8);
    g.fillStyle = scheme.dim; g.font = `500 22px ${SANS}`;
    wrap(g, p.desc, 50, 340, SW * 0.58, 32, 4);
    let x = 50;
    g.font = `600 14px ${MONO}`;
    topics.forEach((tp) => {
      const w = g.measureText(tp).width + 28;
      g.fillStyle = scheme.chip; rr(g, x, 520, w, 34, 17); g.fill();
      g.fillStyle = scheme.fg; g.fillText(tp, x + 14, 542);
      x += w + 10;
    });
    g.save(); g.beginPath(); g.rect(SW * 0.7, 90, SW * 0.27, SH - 140); g.clip();
    g.font = `500 14px ${MONO}`;
    for (let k = 0; k < 30; k++) {
      const y = 100 + ((k * 24 - t * 30) % (30 * 24) + 30 * 24) % (30 * 24);
      g.fillStyle = k % 7 === 0 ? scheme.fg : scheme.dim;
      const hex = Math.floor(rnd(k + p.id.length) * 0xffffff).toString(16).padStart(6, "0");
      g.fillText(`${hex}  ${"▇▅▃▂▁▂▅".slice(0, 1 + (k % 6))}  ${(rnd(k * 3) * 99).toFixed(1)}`, SW * 0.72, y);
    }
    g.restore();
  };
}

export function screenPainter(p: Project) {
  const custom = PAINTERS[p.id];
  return { paint: custom ?? generic(p), custom: !!custom };
}

export function createScreenTexture(p: Project) {
  const cv = document.createElement("canvas");
  cv.width = SW; cv.height = SH;
  const g = cv.getContext("2d")!;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const { paint } = screenPainter(p);
  return {
    tex,
    draw(t: number) { g.save(); paint(g, t); g.restore(); tex.needsUpdate = true; },
  };
}
