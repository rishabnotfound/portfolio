const GLYPHS = "!<>-_\\/[]{}=+*^?#░▒▓01";
const original = new WeakMap<Text, string>();
const garbled = new WeakSet<Text>();
const running = new WeakMap<HTMLElement, number>();

function textNodes(el: HTMLElement) {
  const out: Text[] = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) out.push(walk.currentNode as Text);
  return out;
}

export function scramble(el: HTMLElement, dur = 700) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  cancelAnimationFrame(running.get(el) ?? 0);
  const nodes = textNodes(el).map((n) => {
    if (!garbled.has(n)) original.set(n, n.data);
    const text = original.get(n)!;
    return { n, text, at: [...text].map((_, i) => (i / Math.max(1, text.length)) * 0.7 + Math.random() * 0.3), last: n.data };
  });
  const t0 = performance.now();
  const step = (now: number) => {
    const p = (now - t0) / dur;
    let live = false;
    for (const s of nodes) {
      if (s.n.data !== s.last) { garbled.delete(s.n); continue; }
      const next = [...s.text].map((ch, i) => (ch === " " || p >= s.at[i] ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
      s.n.data = s.last = next;
      if (next !== s.text) { live = true; garbled.add(s.n); } else garbled.delete(s.n);
    }
    if (live) running.set(el, requestAnimationFrame(step));
  };
  running.set(el, requestAnimationFrame(step));
}
