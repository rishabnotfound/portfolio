import { getLive, ago } from "./feed";
import { LINKEDIN } from "./data";
import { config } from "../config";

export const CW = 768, CH = 1024;
const SANS = '"gg sans", "Helvetica Neue", Arial, sans-serif';
const MONO = "ui-monospace, Menlo, Consolas, monospace";
type G = CanvasRenderingContext2D;

const cache = new Map<string, HTMLImageElement>();
function img(src?: string) {
  if (!src) return undefined;
  let im = cache.get(src);
  if (!im) {
    im = new Image();
    im.crossOrigin = "anonymous";
    im.src = src;
    cache.set(src, im);
  }
  return im.complete && im.naturalWidth ? im : undefined;
}

const rr = (g: G, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
function circleImg(g: G, im: HTMLImageElement | undefined, cx: number, cy: number, r: number, fallback = "#444") {
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
  if (im) g.drawImage(im, cx - r, cy - r, r * 2, r * 2); else { g.fillStyle = fallback; g.fill(); }
  g.restore();
}
function wrap(g: G, text: string, x: number, y: number, maxW: number, lh: number, maxLines: number) {
  const words = text.split(/\s+/);
  let line = "", n = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) {
      if (n === maxLines - 1) { g.fillText(line + "…", x, y + n * lh); return n + 1; }
      g.fillText(line, x, y + n * lh); line = w; n++;
    } else line = test;
  }
  if (line) g.fillText(line, x, y + n * lh);
  return n + 1;
}
function clip(g: G, s: string, w: number) {
  if (g.measureText(s).width <= w) return s;
  while (s.length > 1 && g.measureText(s + "…").width > w) s = s.slice(0, -1);
  return s + "…";
}
const hms = (ms: number) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s).padStart(2, "0")}`;
};

const STATUS: Record<string, string> = { online: "#23a55a", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e" };

function statusDot(g: G, cx: number, cy: number, r: number, status: string, bg: string) {
  g.fillStyle = bg; g.beginPath(); g.arc(cx, cy, r + 7, 0, 7); g.fill();
  g.fillStyle = STATUS[status] ?? STATUS.offline; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill();
  g.fillStyle = bg;
  if (status === "dnd") { rr(g, cx - r * 0.6, cy - r * 0.16, r * 1.2, r * 0.32, r * 0.16); g.fill(); }
  else if (status === "idle") { g.beginPath(); g.arc(cx - r * 0.42, cy - r * 0.42, r * 0.62, 0, 7); g.fill(); }
  else if (status === "offline") { g.beginPath(); g.arc(cx, cy, r * 0.5, 0, 7); g.fill(); }
}

type ActivityBox =
  | { kind: "spotify"; song: string; artist: string; start: number; end: number; art?: string }
  | { kind: "app"; type: number; name: string; details?: string; state?: string; start?: number; end?: number; large?: string; small?: string };

function activityLabel(a: ActivityBox) {
  if (a.kind === "spotify") return "LISTENING TO SPOTIFY";
  return a.type === 1 ? "STREAMING" : a.type === 2 ? `LISTENING TO ${a.name.toUpperCase()}` : a.type === 3 ? "WATCHING" : a.type === 5 ? "COMPETING IN" : "PLAYING";
}

function drawActivity(g: G, a: ActivityBox, x0: number, y0: number, w: number, h: number, now: number) {
  rr(g, x0, y0, w, h, 18); g.fillStyle = "#1e1f22"; g.fill();
  g.font = `800 20px ${SANS}`; g.fillStyle = "#b5bac1"; g.fillText(activityLabel(a), x0 + 26, y0 + 36);
  const s = Math.min(140, h - 66), ix = x0 + 26, iy = y0 + 52, tx = ix + s + 24, tw = x0 + w - 24 - tx;
  const art = img(a.kind === "spotify" ? a.art : a.large);
  rr(g, ix, iy, s, s, a.kind === "spotify" ? 10 : 16); g.fillStyle = "#333"; g.fill();
  if (art) { g.save(); rr(g, ix, iy, s, s, a.kind === "spotify" ? 10 : 16); g.clip(); g.drawImage(art, ix, iy, s, s); g.restore(); }
  const big = s >= 110, lh = big ? 36 : 30;
  const track = a.kind === "spotify"
    ? { title: a.song, sub: `by ${a.artist}`, start: a.start, end: a.end }
    : a.start && a.end ? { title: a.details ?? a.name, sub: a.state, start: a.start, end: a.end } : null;
  g.font = `800 ${big ? 32 : 27}px ${SANS}`; g.fillStyle = "#f2f3f5";
  g.fillText(clip(g, track ? track.title : a.kind === "app" ? a.name : "", tw), tx, iy + (big ? 30 : 25));

  if (track) {
    if (a.kind === "app") {
      const small = img(a.small);
      if (small) { g.fillStyle = "#1e1f22"; g.beginPath(); g.arc(ix + s - 8, iy + s - 8, 26, 0, 7); g.fill(); circleImg(g, small, ix + s - 8, iy + s - 8, 20); }
    }
    g.font = `500 ${big ? 26 : 22}px ${SANS}`; g.fillStyle = "#b5bac1";
    if (track.sub) g.fillText(clip(g, track.sub, tw), tx, iy + (big ? 30 : 25) + lh);
    const k = Math.min(1, Math.max(0, (now - track.start) / (track.end - track.start)));
    const by = iy + s - 30;
    rr(g, tx, by, tw, 8, 4); g.fillStyle = "#4e5058"; g.fill();
    rr(g, tx, by, tw * k, 8, 4); g.fillStyle = "#f2f3f5"; g.fill();
    g.font = `500 19px ${MONO}`; g.fillStyle = "#b5bac1";
    g.fillText(hms(Math.min(now, track.end) - track.start), tx, iy + s - 2);
    g.textAlign = "right"; g.fillText(hms(track.end - track.start), tx + tw, iy + s - 2); g.textAlign = "left";
    return;
  }
  if (a.kind !== "app") return;
  const small = img(a.small);
  if (small) { g.fillStyle = "#1e1f22"; g.beginPath(); g.arc(ix + s - 8, iy + s - 8, 26, 0, 7); g.fill(); circleImg(g, small, ix + s - 8, iy + s - 8, 20); }
  const footer = a.start ? iy + s - 4 : iy + s + 10;
  let y = iy + (big ? 30 : 25) + lh;
  g.font = `500 ${big ? 26 : 22}px ${SANS}`;
  [[a.details, "#dbdee1"], [a.state, "#b5bac1"]].forEach(([t, c]) => {
    if (!t || y > footer - lh + 6) return;
    g.fillStyle = c!; g.fillText(clip(g, t, tw), tx, y); y += lh;
  });
  if (a.start) { g.fillStyle = "#23a55a"; g.font = `700 ${big ? 24 : 20}px ${MONO}`; g.fillText(`⏱ ${hms(now - a.start)}`, tx, footer); }
}

export function discordCard(g: G, now: number) {
  const L = getLive(), d = L.discord, p = L.presence;
  const BG = "#111214", CARD = "#232428", BH = 210;
  const accent = d?.color != null ? `#${d.color.toString(16).padStart(6, "0")}` : "#5865f2";
  g.fillStyle = BG; g.fillRect(0, 0, CW, CH);
  const banner = img(config.signal.discordBanner);
  if (banner) {
    const s = Math.max(CW / banner.naturalWidth, BH / banner.naturalHeight);
    const bw = banner.naturalWidth * s, bh = banner.naturalHeight * s;
    g.save(); g.beginPath(); g.rect(0, 0, CW, BH); g.clip();
    g.drawImage(banner, (CW - bw) / 2, (BH - bh) / 2, bw, bh);
    g.restore();
  } else {
    const ban = g.createLinearGradient(0, 0, CW, BH);
    ban.addColorStop(0, accent); ban.addColorStop(1, "#2a0010");
    g.fillStyle = ban; g.fillRect(0, 0, CW, BH);
  }

  const ax = 150, ay = BH, ar = 100;
  g.fillStyle = BG; g.beginPath(); g.arc(ax, ay, ar + 12, 0, 7); g.fill();
  circleImg(g, img(d?.avatar), ax, ay, ar, "#5865f2");
  const deco = img(d?.decoration);
  if (deco) g.drawImage(deco, ax - ar * 1.2, ay - ar * 1.2, ar * 2.4, ar * 2.4);
  statusDot(g, ax + ar * 0.72, ay + ar * 0.72, 22, p?.status ?? "offline", BG);

  rr(g, 28, BH + 126, CW - 56, CH - BH - 150, 22); g.fillStyle = CARD; g.fill();
  let y = BH + 196;
  g.font = `800 60px ${SANS}`; g.fillStyle = accent;
  g.shadowColor = accent; g.shadowBlur = 18;
  const name = d?.name ?? config.person.givenName;
  g.fillText(name, 60, y); g.shadowBlur = 0;
  const x = 60 + g.measureText(name).width + 18;
  if (d?.tag) {
    g.font = `700 26px ${SANS}`;
    const w = g.measureText(d.tag.text).width + 66;
    rr(g, x, y - 42, w, 46, 10); g.fillStyle = "#3f4147"; g.fill();
    const tb = img(d.tag.badge); if (tb) g.drawImage(tb, x + 10, y - 35, 32, 32);
    g.fillStyle = "#f2f3f5"; g.fillText(d.tag.text, x + 50, y - 9);
  }
  y += 48;
  g.font = `500 30px ${SANS}`; g.fillStyle = "#dbdee1";
  const uname = d?.username ?? config.person.handle;
  g.fillText(uname, 60, y);
  if (d?.platforms.length) {
    const ux = 60 + g.measureText(uname).width + 14;
    g.fillStyle = "#949ba4"; g.font = `500 24px ${SANS}`;
    g.fillText(`· on ${d.platforms.join(", ")}`, ux, y);
  }
  if (d?.custom) { y += 46; g.font = `500 27px ${SANS}`; g.fillStyle = "#dbdee1"; g.fillText(clip(g, d.custom, CW - 120), 60, y); }

  y += 30;
  g.fillStyle = "#3f4147"; g.fillRect(60, y, CW - 120, 2);
  y += 46;
  g.font = `800 20px ${SANS}`; g.fillStyle = "#f2f3f5"; g.fillText("MEMBER SINCE", 60, y);
  const since = 60 + g.measureText("MEMBER SINCE").width + 18;
  const created = d ? new Date(Math.floor(Number(d.id) / 4194304) + 1420070400000) : null;
  g.font = `500 26px ${SANS}`; g.fillStyle = "#dbdee1";
  g.fillText(created ? created.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—", since, y);

  const items: ActivityBox[] = [
    ...(p?.spotify ? [{ kind: "spotify" as const, ...p.spotify }] : []),
    ...(d?.activities ?? []).map((a) => ({ kind: "app" as const, ...a })),
  ].slice(0, 2);
  const top = y + 26, bottom = CH - 48;
  if (!items.length) {
    rr(g, 48, top, CW - 96, bottom - top, 18); g.fillStyle = "#1e1f22"; g.fill();
    g.font = `800 20px ${SANS}`; g.fillStyle = "#b5bac1"; g.fillText("ACTIVITY", 74, top + 36);
    g.font = `500 28px ${SANS}`; g.fillStyle = "#949ba4"; g.fillText("Nothing running right now.", 74, top + (bottom - top) / 2 + 24);
  } else {
    const gap = 14, h = (bottom - top - gap * (items.length - 1)) / items.length;
    items.forEach((a, i) => drawActivity(g, a, 48, top + i * (h + gap), CW - 96, Math.min(h, 240), now));
  }

}

export function leetcodeCard(g: G) {
  const L = getLive(), l = L.leet;
  g.fillStyle = "#1a1a1a"; g.fillRect(0, 0, CW, CH);
  g.fillStyle = "#ffa116"; g.fillRect(0, 0, CW, 10);
  circleImg(g, img(L.gh?.avatar), 96, 112, 52);
  g.font = `800 40px ${SANS}`; g.fillStyle = "#eff1f6"; g.fillText(config.accounts.leetcode, 170, 104);
  g.font = `500 26px ${SANS}`; g.fillStyle = "#eff1f6bf"; g.fillText("LeetCode", 170, 144);
  g.textAlign = "right"; g.font = `800 26px ${SANS}`; g.fillStyle = "#ffa116"; g.fillText("RANK", CW - 48, 92);
  g.font = `800 52px ${SANS}`; g.fillStyle = "#eff1f6"; g.fillText(l ? `#${l.ranking.toLocaleString("en-US")}` : "—", CW - 48, 146);
  g.textAlign = "left";

  rr(g, 40, 200, CW - 80, 470, 22); g.fillStyle = "#282828"; g.fill();
  const cx = 240, cy = 435, r = 150;
  const start = Math.PI * 0.75, span = Math.PI * 1.5;
  g.lineCap = "round"; g.lineWidth = 16;
  g.strokeStyle = "#3e3e3e"; g.beginPath(); g.arc(cx, cy, r, start, start + span); g.stroke();
  if (l) {
    const segs: [number, string][] = [[l.easySolved, "#1cbaba"], [l.mediumSolved, "#ffb700"], [l.hardSolved, "#f63737"]];
    let a = start;
    segs.forEach(([n, c]) => {
      const len = (n / l.totalQuestions) * span;
      g.strokeStyle = c; g.beginPath(); g.arc(cx, cy, r, a + 0.02, a + len - 0.02); g.stroke();
      a += len;
    });
  }
  g.lineCap = "butt"; g.textAlign = "center";
  g.font = `800 76px ${SANS}`; g.fillStyle = "#eff1f6"; g.fillText(l ? String(l.totalSolved) : "—", cx, cy + 10);
  g.font = `500 26px ${SANS}`; g.fillStyle = "#eff1f6bf"; g.fillText(l ? `/${l.totalQuestions}` : "", cx, cy + 50);
  g.font = `600 24px ${SANS}`; g.fillStyle = "#ffa116"; g.fillText("✓ Solved", cx, cy + 96);
  g.textAlign = "left";

  const rows: [string, string, number, number][] = l
    ? [["Easy", "#1cbaba", l.easySolved, l.totalEasy], ["Med.", "#ffb700", l.mediumSolved, l.totalMedium], ["Hard", "#f63737", l.hardSolved, l.totalHard]]
    : [];
  rows.forEach(([k, c, n, t], i) => {
    const y = 262 + i * 132;
    rr(g, 430, y, 280, 112, 16); g.fillStyle = "#3e3e3e"; g.fill();
    g.font = `700 26px ${SANS}`; g.fillStyle = c; g.fillText(k, 454, y + 44);
    g.font = `800 32px ${SANS}`; g.fillStyle = "#eff1f6"; g.fillText(String(n), 454, y + 88);
    const nx = 454 + g.measureText(String(n)).width + 6;
    g.font = `500 22px ${SANS}`; g.fillStyle = "#eff1f6aa"; g.fillText(`/${t}`, nx, y + 88);
  });

  rr(g, 40, 700, CW - 80, 270, 22); g.fillStyle = "#282828"; g.fill();
  if (l) {
    const pct = (l.totalSolved / l.totalQuestions) * 100;
    g.font = `600 26px ${SANS}`; g.fillStyle = "#eff1f6bf"; g.fillText("Problem set cleared", 72, 764);
    g.font = `800 92px ${SANS}`; g.fillStyle = "#ffa116"; g.fillText(`${pct.toFixed(1)}%`, 72, 870);
    rr(g, 72, 904, CW - 144, 14, 7); g.fillStyle = "#3e3e3e"; g.fill();
    rr(g, 72, 904, (CW - 144) * (pct / 100), 14, 7); g.fillStyle = "#ffa116"; g.fill();
    g.font = `600 22px ${MONO}`; g.fillStyle = "#eff1f6aa"; g.fillText(`hard ratio ${((l.hardSolved / l.totalSolved) * 100).toFixed(0)}% · global #${l.ranking}`, 72, 950);
  }
}

const LANG: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5", Go: "#00ADD8", Lua: "#000080", Shell: "#89e051",
  CSS: "#563d7c", HTML: "#e34c26", Kotlin: "#A97BFF", C: "#555555", PHP: "#4F5D95", Java: "#b07219", Vue: "#41b883",
};
export function githubCard(g: G) {
  const L = getLive(), u = L.gh;
  g.fillStyle = "#0d1117"; g.fillRect(0, 0, CW, CH);
  g.strokeStyle = "#30363d"; g.lineWidth = 2;
  circleImg(g, img(u?.avatar), 128, 140, 88);
  g.beginPath(); g.arc(128, 140, 89, 0, 7); g.stroke();
  g.font = `700 44px ${SANS}`; g.fillStyle = "#e6edf3"; g.fillText(clip(g, u?.name || config.person.name, CW - 300), 248, 122);
  g.font = `300 32px ${SANS}`; g.fillStyle = "#8d96a0"; g.fillText(u?.login ?? config.accounts.github, 248, 168);
  g.font = `500 24px ${SANS}`; g.fillStyle = "#e6edf3";
  wrap(g, u?.bio || "Code. Break. Repeat. Ship.", 48, 276, CW - 96, 34, 2);
  g.font = `500 26px ${SANS}`; g.fillStyle = "#8d96a0";
  const fol = `${u?.followers ?? "—"} followers · ${u?.following ?? "—"} following`;
  g.fillText(fol, 48, 360);

  const stats: [string, number | undefined][] = [["Repos", L.repos], ["Stars", L.stars], ["Contribs / yr", L.contribTotal]];
  stats.forEach(([k, v], i) => {
    const x = 48 + i * 230;
    rr(g, x, 396, 210, 112, 14); g.strokeStyle = "#30363d"; g.stroke();
    g.font = `700 44px ${SANS}`; g.fillStyle = "#e6edf3"; g.fillText(v != null ? v.toLocaleString("en-US") : "—", x + 22, 456);
    g.font = `500 22px ${SANS}`; g.fillStyle = "#8d96a0"; g.fillText(k, x + 22, 490);
  });

  const days = (L.days ?? []).slice(-26 * 7);
  const pal = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];
  g.font = `600 22px ${SANS}`; g.fillStyle = "#8d96a0"; g.fillText("Last 6 months", 48, 560);
  days.forEach((dd, i) => {
    g.fillStyle = pal[dd.level] ?? pal[0];
    rr(g, 48 + Math.floor(i / 7) * 26.5, 580 + (i % 7) * 26.5, 22, 22, 4); g.fill();
  });

  const langs = L.langs ?? [];
  const total = langs.reduce((a, x) => a + x.count, 0) || 1;
  let x = 48;
  g.font = `600 22px ${SANS}`; g.fillStyle = "#8d96a0"; g.fillText("Languages", 48, 800);
  langs.slice(0, 6).forEach((lg) => {
    const w = ((CW - 96) * lg.count) / total;
    g.fillStyle = LANG[lg.name] ?? "#8d96a0"; g.fillRect(x, 816, w - 2, 14); x += w;
  });
  langs.slice(0, 6).forEach((lg, i) => {
    const lx = 48 + (i % 3) * 230, ly = 868 + Math.floor(i / 3) * 36;
    g.fillStyle = LANG[lg.name] ?? "#8d96a0"; g.beginPath(); g.arc(lx + 8, ly - 8, 8, 0, 7); g.fill();
    g.font = `500 22px ${SANS}`; g.fillStyle = "#e6edf3"; g.fillText(`${lg.name} ${Math.round((lg.count / total) * 100)}%`, lx + 24, ly);
  });
  const c = L.commits?.[0];
  g.font = `500 21px ${MONO}`; g.fillStyle = "#8d96a0";
  g.fillText(clip(g, c ? `⎇ ${c.repo.split("/")[1]}: ${c.msg} · ${ago(c.date).toLowerCase()}` : "⎇ syncing…", CW - 96), 48, 980);
}

export function linkedinCard(g: G) {
  const L = getLive(), li = LINKEDIN;
  g.fillStyle = "#ffffff"; g.fillRect(0, 0, CW, CH);
  const ban = g.createLinearGradient(0, 0, CW, 200);
  ban.addColorStop(0, "#a0b4b7"); ban.addColorStop(1, "#6e8a8f");
  g.fillStyle = ban; g.fillRect(0, 0, CW, 200);
  g.fillStyle = "#ffffff"; g.beginPath(); g.arc(150, 210, 112, 0, 7); g.fill();
  circleImg(g, img(L.gh?.avatar), 150, 210, 104);

  const logos: [string, string][] = [[li.company.logo, li.company.name], [li.school.logo, li.school.name]];
  logos.forEach(([src, name], i) => {
    const y = 360 + i * 54;
    const im = img(src);
    rr(g, CW - 330, y - 34, 42, 42, 6); g.fillStyle = src.endsWith(".png") ? "#0b1d33" : "#fff"; g.fill();
    if (im) g.drawImage(im, CW - 328, y - 32, 38, 38);
    g.font = `600 22px ${SANS}`; g.fillStyle = "#000000e6"; g.fillText(clip(g, name, 270), CW - 276, y - 6);
  });

  g.font = `700 44px ${SANS}`; g.fillStyle = "#000000e6"; g.fillText(li.name, 48, 380);
  const px = 48 + g.measureText(li.name).width + 14;
  g.font = `400 26px ${SANS}`; g.fillStyle = "#00000099"; g.fillText(li.pronouns, px, 378);
  g.font = `400 26px ${SANS}`; g.fillStyle = "#000000e6";
  const lines = wrap(g, li.headline, 48, 430, 360, 34, 5);
  let y = 430 + lines * 34 + 24;
  g.font = `400 24px ${SANS}`; g.fillStyle = "#00000099"; g.fillText(`${li.location} · `, 48, y);
  const cx2 = 48 + g.measureText(`${li.location} · `).width;
  g.fillStyle = "#0a66c2"; g.font = `700 24px ${SANS}`; g.fillText("Contact info", cx2, y);
  y += 42;
  g.fillText(`${li.followers} followers · ${li.connections} connections`, 48, y);
  y += 50;
  rr(g, 48, y, 170, 60, 30); g.fillStyle = "#0a66c2"; g.fill();
  g.fillStyle = "#fff"; g.font = `700 26px ${SANS}`; g.fillText("+ Connect", 76, y + 39);
  rr(g, 234, y, 170, 60, 30); g.strokeStyle = "#0a66c2"; g.lineWidth = 2; g.stroke();
  g.fillStyle = "#0a66c2"; g.fillText("Message", 270, y + 39);

  y += 108;
  g.fillStyle = "#e8e5df"; g.fillRect(0, y - 30, CW, 10);
  g.font = `700 32px ${SANS}`; g.fillStyle = "#000000e6"; g.fillText("About", 48, y + 26);
  g.font = `400 24px ${SANS}`; g.fillStyle = "#000000bf";
  wrap(g, li.about, 48, y + 74, CW - 96, 34, 5);
  g.fillStyle = "#0a66c2"; g.fillRect(0, CH - 12, CW, 12);
  g.font = `800 30px ${SANS}`; g.fillStyle = "#0a66c2"; g.textAlign = "right"; g.fillText("in", CW - 40, 60); g.textAlign = "left";
}
