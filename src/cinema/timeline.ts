export type ChapterKey = "hero" | "work" | "about" | "commits" | "journey" | "signal" | "contact";

export const ORDER: ChapterKey[] = ["hero", "work", "about", "commits", "journey", "signal", "contact"];

export const TRANSITION = 0.75;

export type Located = { i: number; lp: number; t: number };
export type Timeline = ReturnType<typeof buildTimeline>;

export function buildTimeline(projects: number) {
  const lens: Record<ChapterKey, number> = {
    hero: 1.4, work: 1.3 * projects, about: 3, commits: 3.2, journey: 3.4, signal: 3.6, contact: 1.8,
  };
  const chapters = ORDER.map((key) => ({ key, len: lens[key] }));
  const starts = chapters.reduce<number[]>((a, c, i) => (a.push(i ? a[i - 1] + chapters[i - 1].len : 0), a), []);
  const total = starts[starts.length - 1] + chapters[chapters.length - 1].len;
  const index = (key: ChapterKey) => ORDER.indexOf(key);

  function locate(p: number): Located {
    let i = chapters.length - 1;
    while (i > 0 && p < starts[i]) i--;
    const { len } = chapters[i];
    const lp = Math.min(1, Math.max(0, (p - starts[i]) / len));
    const last = i === chapters.length - 1;
    const t = last ? 0 : Math.min(1, Math.max(0, (p - (starts[i] + len - TRANSITION)) / TRANSITION));
    return { i, lp, t };
  }

  const scrollTargetFor = (key: ChapterKey, local = 0.12) =>
    (starts[index(key)] + chapters[index(key)].len * local) * window.innerHeight;

  return { chapters, starts, total, index, locate, scrollTargetFor };
}

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
