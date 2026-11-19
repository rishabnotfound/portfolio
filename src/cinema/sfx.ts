import { useSyncExternalStore } from "react";

let ctx: AudioContext | null = null;
let on = (() => { try { return localStorage.getItem("sfx") === "1"; } catch { return false; } })();
const subs = new Set<() => void>();

const audio = () => {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
};

export function setSfx(v: boolean) {
  on = v;
  try { localStorage.setItem("sfx", v ? "1" : "0"); } catch { }
  if (v) audio();
  subs.forEach((f) => f());
}
export const useSfx = () => useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), () => on);

type ToneOpts = { type?: OscillatorType; gain?: number; to?: number };
function tone(freq: number, dur: number, { type = "sine", gain = 0.04, to }: ToneOpts = {}) {
  if (!on) return;
  const c = audio(), t = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur: number, gain: number, from: number, to: number) {
  if (!on) return;
  const c = audio(), t = c.currentTime;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass"; f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t);
}

let lastTick = 0;
export const sfx = {
  click: () => { tone(2200, 0.025, { type: "square", gain: 0.016 }); tone(140, 0.05, { gain: 0.05 }); },
  tick: () => {
    const n = performance.now();
    if (n - lastTick < 45) return;
    lastTick = n;
    tone(1800 + Math.random() * 900, 0.012, { type: "square", gain: 0.012 });
  },
  whoosh: () => noise(0.7, 0.06, 300, 2600),
};
