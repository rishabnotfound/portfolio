import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "../lib/seo";
import { startEngine, type Frame } from "./engine";
import { buildTimeline, smooth, type ChapterKey, type Timeline } from "./timeline";
import { workFocus } from "./scenes/work";
import { weekAt, weekSummary } from "./scenes/commits";
import { signalFocus } from "./scenes/signal";
import { stackFocus, shownLangs, langColor, isMobile } from "./scenes/stack";
import { hourColor, rhythmStats } from "./scenes/hours";
import { SOCIALS, GH, BORN, TIMELINE, LINKEDIN, DISCORD_ID, type Project } from "./data";
import { config } from "../config";
import { startLive, loadFeatured, useLive, getLive, contribStats, ago } from "./feed";
import { ContactModal } from "./ContactModal";
import { scramble } from "./scramble";
import { sfx, setSfx, useSfx } from "./sfx";
import "./cinema.css";

type Win = { key: ChapterKey; a: number; b: number; drift?: number };

const PANELS: Win[] = [
  { key: "hero", a: -1, b: 0.5 },
  { key: "work", a: 0.0, b: 0.9 },
  { key: "about", a: 0.04, b: 0.8, drift: 0.35 },
  { key: "stack", a: 0.03, b: 0.9 },
  { key: "commits", a: 0.08, b: 0.82 },
  { key: "hours", a: 0.06, b: 0.78 },
  { key: "journey", a: 0.02, b: 0.9 },
  { key: "signal", a: 0.02, b: 0.8 },
  { key: "contact", a: -0.2, b: 2 },
];

function opacityFor(f: Frame, w: Win, tl: Timeline) {
  const i = tl.index(w.key);
  if (f.i === i - 1 && w.a < 0) return smooth(0.85, 1, f.t);
  if (f.i !== i) return 0;
  const fade = 0.05;
  return Math.min(smooth(w.a, w.a + fade, f.lp), 1 - smooth(w.b - fade, w.b, f.lp));
}

const MENU: { key: ChapterKey; label: string }[] = [
  { key: "hero", label: "HOME" }, { key: "work", label: "WORK" }, { key: "about", label: "ABOUT" },
  { key: "stack", label: "STACK" }, { key: "commits", label: "COMMITS" }, { key: "hours", label: "RHYTHM" }, { key: "journey", label: "JOURNEY" }, { key: "signal", label: "SIGNAL" },
  { key: "contact", label: "CONTACT" },
];

const STATUS_COLOR: Record<string, string> = { online: "#22ff00", idle: "#ffd000", dnd: "#ff3344", offline: "#7a7a7a" };

const STORY_END = 0.66;
const storyStep = (lp: number, n: number) =>
  lp >= STORY_END ? n : Math.min(n - 1, Math.max(0, Math.floor(((lp - 0.03) / (STORY_END - 0.03)) * n)));

const fmtHour = (h: number) => `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
const fmtBytes = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" fillOpacity=".15" />
      {on ? (
        <>
          <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
          <path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
        </>
      ) : (
        <path d="M16 9.5l5 5M21 9.5l-5 5" />
      )}
    </svg>
  );
}

function DotLoader() {
  const cols = 11, rows = 5;
  return (
    <div className="cx-dots" aria-hidden="true">
      {Array.from({ length: cols * rows }, (_, i) => {
        const x = (i % cols) - (cols - 1) / 2, y = Math.floor(i / cols) - (rows - 1) / 2;
        return <i key={i} style={{ animationDelay: `${Math.hypot(x, y * 1.6) * 90}ms` }} />;
      })}
    </div>
  );
}

function uptime() {
  const b = new Date(BORN), n = new Date();
  let y = n.getFullYear() - b.getFullYear(), m = n.getMonth() - b.getMonth(), d = n.getDate() - b.getDate();
  if (d < 0) { m--; d += new Date(n.getFullYear(), n.getMonth(), 0).getDate(); }
  if (m < 0) { y--; m += 12; }
  return `up ${y} years, ${m} months, ${d} days · load avg: building`;
}

export default function Cinema() {
  usePageMeta({ title: config.site.title, description: config.site.description, path: "/" });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panels = useRef<Partial<Record<ChapterKey, HTMLElement | null>>>({});
  const typeRef = useRef<HTMLElement[]>([]);
  const revealRef = useRef<HTMLElement[]>([]);
  const weekRef = useRef<HTMLSpanElement>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [ready, setReady] = useState(false);
  const [noGL, setNoGL] = useState(false);
  const [active, setActive] = useState(0);
  const [sig, setSig] = useState(-1);
  const [story, setStory] = useState(0);
  const [lang, setLang] = useState(-1);
  const storyRef = useRef<HTMLElement | null>(null);
  const [light, setLight] = useState(false);
  const [menu, setMenu] = useState(false);
  const [contact, setContact] = useState(() => !!config.contact.form && location.pathname === "/contact");
  const heroRef = useRef<HTMLElement | null>(null);
  const sound = useSfx();
  const live = useLive();
  const [langCount, setLangCount] = useState(0);
  const tl = useMemo(() => (projects ? buildTimeline(projects.length, langCount) : null), [projects, langCount]);

  useEffect(() => {
    startLive();
    const stackLoaded = new Promise<number>((done) => {
      const t0 = Date.now();
      const poll = () => {
        const s = getLive().stack;
        if (s || Date.now() - t0 > 3000) done(s ? shownLangs(s).length : 0); else setTimeout(poll, 80);
      };
      poll();
    });
    Promise.all([loadFeatured(), stackLoaded]).then(([p, n]) => { setLangCount(n); setProjects(p); });
  }, []);

  useEffect(() => {
    if (!projects || !tl) return;
    document.documentElement.classList.add("cx-html");
    let stop: (() => void) | undefined;
    let cancelled = false;
    let lastActive = -1, lastLight = false, lastWeek = -1, lastSig = -2, lastStory = -1, lastLang = -2, lastT = 0, lastTyped = 0;
    const shown = new Map<HTMLElement, boolean>();
    const workI = tl.index("work"), aboutI = tl.index("about"), commitsI = tl.index("commits"), journeyI = tl.index("journey"), stackI = tl.index("stack"), signalI = tl.index("signal");
    const minDelay = new Promise((r) => setTimeout(r, 900));

    startEngine(canvasRef.current!, projects, tl, (f) => {
      for (const w of PANELS) {
        const el = panels.current[w.key];
        if (!el) continue;
        const o = opacityFor(f, w, tl);
        el.style.opacity = String(o);
        el.style.visibility = o > 0.01 ? "visible" : "hidden";
        const vis = o > 0.3;
        if (vis && !shown.get(el)) el.querySelectorAll<HTMLElement>("[data-scramble]").forEach((n) => scramble(n));
        shown.set(el, vis);
        const glitchX = 0;
        const drift = w.drift && f.i === tl.index(w.key) ? (0.5 - f.lp) * w.drift * 100 : 0;
        el.style.transform = `translate3d(${glitchX}px, ${drift}vh, 0)`;
      }
      if (f.i === signalI) {
        const fs = signalFocus(f.lp);
        const sgi = fs < 0 ? -1 : Math.round(fs);
        if (sgi !== lastSig) { lastSig = sgi; setSig(sgi); }
      }
      if (f.i === workI) {
        const a = Math.round(workFocus(f.lp, projects.length));
        if (a !== lastActive) { lastActive = a; setActive(a); }
      }
      if (f.i === aboutI) {
        const lines = typeRef.current;
        const total = lines.reduce((s, el) => s + (el.dataset.text?.length ?? 0), 0);
        let budget = smooth(0.05, 0.62, f.lp) * total;
        const typedNow = Math.floor(budget);
        if (typedNow !== lastTyped && typedNow > 0 && typedNow < total) sfx.tick();
        lastTyped = typedNow;
        for (const el of lines) {
          const text = el.dataset.text ?? "";
          const n = Math.max(0, Math.min(text.length, Math.floor(budget)));
          budget -= text.length;
          if (el.textContent?.length !== n) el.textContent = text.slice(0, n);
          el.classList.toggle("is-typing", n > 0 && n < text.length);
        }
      }
      if (f.i === stackI) {
        const n = shownLangs(getLive().stack ?? []).length;
        const li = stackFocus(f.lp, n);
        if (li !== lastLang) { lastLang = li; setLang(li); if (li >= 0) sfx.tick(); }
      }
      if (f.i === journeyI) {
        const st = storyStep(f.lp, TIMELINE.length);
        if (st !== lastStory) { lastStory = st; setStory(st); sfx.tick(); }
        const fill = panels.current.journey?.querySelector<HTMLElement>(".cx-story-fill");
        if (fill) fill.style.transform = `scaleY(${Math.min(1, Math.max(0, (f.lp - 0.03) / (STORY_END - 0.03)))})`;
        const pr = revealRef.current.filter((el) => el.dataset.group === "pr");
        pr.forEach((el, k) => el.classList.toggle("is-on", f.lp > STORY_END + 0.015 + (k / pr.length) * 0.08));
      }
      if (f.i === commitsI && weekRef.current) {
        const wk = weekAt(f.lp);
        if (wk !== lastWeek) {
          lastWeek = wk;
          const days = getLive().days;
          const s = days && weekSummary(days, wk);
          weekRef.current.textContent = s ? `WEEK OF ${s.label} — ${s.count} CONTRIBUTIONS` : "SYNCING…";
        }
      }
      if (f.t > 0 && lastT === 0) sfx.whoosh();
      lastT = f.t;
      const isLight = (f.i === workI && f.t < 0.55) || (f.i === workI - 1 && f.t > 0.6);
      if (isLight !== lastLight) { lastLight = isLight; setLight(isLight); }
    })
      .then(async (s) => {
        stop = s;
        await Promise.all([minDelay, document.fonts.ready]);
        if (cancelled) s(); else setReady(true);
      })
      .catch((err) => {
        console.error("webgl unavailable", err);
        if (!cancelled) { setNoGL(true); setReady(true); }
      });
    return () => {
      cancelled = true;
      stop?.();
      document.documentElement.classList.remove("cx-html");
    };
  }, [projects, tl]);

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  useEffect(() => {
    storyRef.current?.querySelectorAll<HTMLElement>("[data-scramble]").forEach((n) => scramble(n, 600));
  }, [story]);

  useEffect(() => {
    if (!ready || !heroRef.current) return;
    heroRef.current.querySelectorAll<HTMLElement>("[data-scramble]").forEach((n) => scramble(n, 1100));
  }, [ready]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => (e.target as HTMLElement)?.closest?.("a, button") && sfx.click();
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => {
    const onPop = () => setContact(!!config.contact.form && location.pathname === "/contact");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openContact = (e: React.MouseEvent) => {
    if (!config.contact.form) return;
    e.preventDefault();
    setMenu(false);
    setContact(true);
    if (location.pathname !== "/contact") history.pushState(null, "", "/contact");
  };
  const closeContact = useCallback(() => {
    setContact(false);
    if (location.pathname === "/contact") history.replaceState(null, "", "/");
  }, []);
  const contactHref = config.contact.form ? "/contact" : `mailto:${config.person.email}`;

  function go(key: ChapterKey) {
    setMenu(false);
    if (tl) window.scrollTo({ top: tl.scrollTargetFor(key, key === "contact" ? 1 : 0.1), behavior: "smooth" });
  }

  const p = projects?.[active];
  const dot = STATUS_COLOR[live.presence?.status ?? "offline"];
  const reg = (k: ChapterKey) => (el: HTMLElement | null) => { panels.current[k] = el; };
  const tokens: Record<string, string> = {
    uptime: uptime(), repos: String(live.repos ?? "…"), stars: String(live.stars ?? "…"),
    followers: String(live.followers ?? "…"), solved: String(live.solved ?? "…"),
  };
  const term = config.terminal.lines.map(([cmd, out]) => [cmd, out.replace(/\{(\w+)\}/g, (m, k) => tokens[k] ?? m)] as const);
  typeRef.current = [];
  revealRef.current = [];
  const typed = (el: HTMLElement | null) => { if (el) typeRef.current.push(el); };
  const reveal = (el: HTMLElement | null) => { if (el) revealRef.current.push(el); };
  const cs = live.days && contribStats(live.days);
  const prs = live.prs ?? [];
  const langs = shownLangs(live.stack ?? []);
  const win = isMobile() ? 5 : 11;
  const from = Math.max(0, Math.min(langs.length - win, (lang < 0 ? 0 : lang) - Math.floor(win / 2)));
  const visibleLangs = langs.slice(from, from + win);
  const rh = live.rhythm && (() => {
    const r = live.rhythm!;
    const st = rhythmStats(r);
    const nowHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: config.person.timezone, hour: "numeric", hourCycle: "h23" }).format(new Date())) % 24;
    return {
      ...st, sample: r.sample, days: r.days, topDay: r.days.indexOf(Math.max(...r.days)), maxDay: Math.max(1, ...r.days),
      nowHour, nowCount: r.hours[nowHour],
      quiet: st.quietLen >= 2 ? `${fmtHour(st.quietFrom)} – ${fmtHour((st.quietFrom + st.quietLen) % 24)}` : "There's no quiet hour",
      since: new Date(r.first).toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase(),
    };
  })();
  const signalInfo = {
    discord: {
      label: "DISCORD", href: `https://discord.com/users/${DISCORD_ID}`,
      line: `${(live.presence?.status ?? "offline").toUpperCase()}${[live.presence?.spotify && `♪ ${live.presence.spotify.song}`, ...(live.discord?.activities ?? []).map((a) => (a.type === 2 && a.details ? `♪ ${a.details}` : a.name))].filter(Boolean).map((s) => ` · ${s}`).join("")}`,
    },
    leetcode: { label: "LEETCODE", href: `https://leetcode.com/u/${config.accounts.leetcode}/`, line: live.leet ? `${live.leet.totalSolved} SOLVED · GLOBAL RANK #${live.leet.ranking}` : "SYNCING…" },
    github: { label: "GITHUB", href: GH, line: `${live.repos ?? "…"} REPOS · ${live.stars ?? "…"} STARS · ${live.contribTotal?.toLocaleString("en-US") ?? "…"} CONTRIBUTIONS / YR` },
    linkedin: { label: "LINKEDIN", href: LINKEDIN.url, line: `${LINKEDIN.followers} FOLLOWERS · ${LINKEDIN.tagline}` },
  };
  const signalCards = config.signal.cards.map((k) => signalInfo[k]);
  const year = new Date().getFullYear();

  return (
    <div className={`cx${light ? " is-light" : ""}${noGL ? " cx-nogl" : ""}${ready ? " is-ready" : ""}`}>
      <canvas ref={canvasRef} className="cx-canvas" aria-hidden="true" />
      <div className="cx-spacer" style={{ height: `${((tl?.total ?? 1) + 1) * 100}vh` }} aria-hidden="true" />

      <div className={`cx-loader${ready ? " is-done" : ""}`} aria-hidden={ready}>
        <DotLoader />
        <span className="cx-loader-label">LOADING</span>
      </div>

      <header className="cx-head">
        <a href="#" className="cx-brand cx-dot-type" onClick={(e) => { e.preventDefault(); go("hero"); }}>{config.person.name}</a>
        <nav className="cx-head-right">
          <button type="button" className="cx-hd-btn cx-hd-sfx" onClick={() => setSfx(!sound)} aria-pressed={sound} aria-label={sound ? "Mute sound" : "Unmute sound"} title={sound ? "Mute" : "Unmute"}><SoundIcon on={sound} /></button>
          <a href={contactHref} onClick={openContact} className="cx-talk" title={live.presence ? `Discord: ${live.presence.status}` : undefined}>
            LET&apos;S TALK<i style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
          </a>
          <button type="button" className="cx-menu-btn" onClick={() => setMenu(true)} aria-expanded={menu}>
            MENU<span aria-hidden="true">☰</span>
          </button>
        </nav>
      </header>

      <main className="cx-panels">
        <section ref={(el) => { panels.current.hero = el; heroRef.current = el; }} className="cx-panel cx-hero" aria-label="Intro">
          <div className="cx-hero-name">
            <h1 className="cx-dot-type" data-scramble>{config.person.name}</h1>
          </div>
          <p className="cx-hero-blurb" data-scramble>{config.hero.blurb}</p>
          <p className="cx-scroll-hint">SCROLL ↓</p>
        </section>

        {projects && p && (
          <section ref={reg("work")} className="cx-panel cx-work" aria-label="Selected work">
            <h2 className="cx-dot-type" data-scramble>SELECTED WORK</h2>
            <ol>
              {projects.map((x, i) => (
                <li key={x.id} className={i === active ? "is-active" : ""}>
                  <a href={x.url} target="_blank" rel="noreferrer">[{String(i + 1).padStart(2, "0")}] {x.name}</a>
                </li>
              ))}
            </ol>
            <div className="cx-work-detail" key={p.id}>
              <p className="cx-work-tag">{p.tag}{p.stack ? ` — ${p.stack}` : ""}</p>
              <p>{p.desc}</p>
              <a href={p.url} target="_blank" rel="noreferrer">&gt; OPEN ON GITHUB</a>
              <Link href="/projects">&gt; ALL {live.repos ?? ""} PROJECTS</Link>
            </div>
          </section>
        )}

        <section ref={reg("about")} className="cx-panel cx-term" aria-label="About me">
          <div className="cx-term-bar"><i /><i /><i /><span>{config.terminal.title}</span></div>
          <div className="cx-term-body" aria-hidden="true">
            {term.map(([cmd, out]) => (
              <div key={cmd}>
                <p><b>$ </b><span ref={typed} data-text={cmd} /></p>
                <p className="cx-term-out"><span ref={typed} data-text={out} /></p>
              </div>
            ))}
            <p><b>$ </b><span className="cx-caret" /></p>
          </div>
          <div className="cx-sr">{term.map(([c, o]) => <p key={c}>{c}: {o}</p>)}</div>
          <Link href="/projects">&gt; CLICK TO VIEW ALL PROJECTS</Link>
        </section>

        <section ref={reg("stack")} className="cx-panel cx-stackp" aria-label="Stack">
          <p className="cx-kicker">WHAT I ACTUALLY WRITE</p>
          <h2 className="cx-dot-type" data-scramble>STACK</h2>
          <p className="cx-stackp-sum">
            {langs.length ? `${fmtBytes((live.stack ?? []).reduce((a, l) => a + l.bytes, 0))} OF CODE · ${live.repos ?? "…"} PUBLIC REPOS` : "MAPPING REPOS…"}
          </p>
          <ol>
            {from > 0 && <li className="cx-stackp-more">↑ {from} MORE</li>}
            {visibleLangs.map((l, j) => { const i = from + j; return (
              <li key={l.name} className={i === lang ? "is-active" : lang >= 0 ? "is-dim" : ""} style={{ ["--c" as string]: langColor(l.name) }}>
                <div className="cx-stackp-row">
                  <i />
                  <b>{l.name}</b>
                  <span>{(l.share * 100).toFixed(l.share < 0.01 ? 1 : 0)}%</span>
                </div>
                <div className="cx-stackp-bar"><em style={{ width: `${Math.max(1.5, (l.share / (langs[0]?.share || 1)) * 100)}%` }} /></div>
                {i === lang && <p className="cx-stackp-repos">{l.repos.slice(0, 6).join(" · ")}{l.repos.length > 6 ? ` +${l.repos.length - 6}` : ""}</p>}
              </li>
            ); })}
            {from + win < langs.length && <li className="cx-stackp-more">↓ {langs.length - from - win} MORE</li>}
          </ol>
        </section>

        <section ref={reg("commits")} className="cx-panel cx-commits" aria-label="Contributions">
          <p className="cx-commits-week"><span ref={weekRef}>SYNCING…</span></p>
          <div className="cx-commits-main">
            <p className="cx-commits-total cx-dot-type">{live.contribTotal?.toLocaleString("en-US") ?? "—"}</p>
            <p className="cx-commits-label" data-scramble>CONTRIBUTIONS IN THE LAST 12 MONTHS</p>
            {cs && (
              <ul>
                <li><span>BUSIEST DAY</span>{cs.busiest.count} ON {new Date(cs.busiest.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}</li>
                <li><span>CURRENT STREAK</span>{cs.current} DAYS</li>
                <li><span>LONGEST STREAK</span>{cs.longest} DAYS</li>
              </ul>
            )}
            <a href={GH} target="_blank" rel="noreferrer">&gt; GITHUB.COM/{config.accounts.github.toUpperCase()}</a>
          </div>
        </section>

        <section ref={reg("hours")} className="cx-panel cx-hoursp" aria-label="When I code">
          <p className="cx-kicker">WHEN I ACTUALLY CODE</p>
          <h2 className="cx-dot-type" data-scramble>RHYTHM</h2>
          {rh ? (
            <>
              <div className="cx-hoursp-big">
                <p className="cx-dot-type" style={{ color: hourColor(rh.peak).getStyle() }}>{fmtHour(rh.peak)}</p>
                <span>PEAK HOUR · {rh.verdict}</span>
              </div>
              <p className="cx-hoursp-line"><b>{rh.night}%</b> of commits land between midnight and 6 AM.</p>
              <p className="cx-hoursp-line cx-hoursp-quiet"><b>{rh.quiet}</b> is the quietest stretch — that's sleep.</p>
              <p className="cx-hoursp-now">
                <i />RIGHT NOW · {fmtHour(rh.nowHour)} IN DELHI · {rh.nowCount ? `${rh.nowCount} COMMITS AT THIS HOUR` : "USUALLY ASLEEP"}
              </p>
              <div className="cx-hoursp-days">
                {rh.days.map((n, i) => (
                  <div key={i} className={i === rh.topDay ? "is-top" : ""}>
                    <i style={{ height: `${Math.max(6, (n / rh.maxDay) * 100)}%` }} />
                    <span>{"MTWTFSS"[i]}</span>
                  </div>
                ))}
              </div>
              <p className="cx-hoursp-foot">LAST {rh.sample} COMMITS TO MY OWN REPOS · SINCE {rh.since} · {config.person.timezone.split("/")[1]?.toUpperCase()} TIME</p>
            </>
          ) : <p className="cx-hoursp-foot">READING COMMIT HISTORY…</p>}
        </section>

        <section ref={reg("journey")} className="cx-panel cx-story" aria-label="Journey" data-phase={story >= TIMELINE.length ? "prs" : "story"}>
          <nav className="cx-story-rail" aria-label="Milestones">
            <p className="cx-story-head" data-scramble>JOURNEY</p>
            <div className="cx-story-line"><i className="cx-story-fill" /></div>
            <ol>
              {TIMELINE.map((t, i) => (
                <li key={`${t.when}${t.org}`} className={i === story ? "is-active" : i < story ? "is-done" : ""}>
                  <i />
                  <span>{t.when}</span>
                  <b>{t.org}</b>
                </li>
              ))}
              <li className={story >= TIMELINE.length ? "is-active" : ""}><i /><span>NOW</span><b>Upstream</b></li>
            </ol>
          </nav>

          {story < TIMELINE.length && (() => {
            const t = TIMELINE[story];
            return (
              <article className="cx-story-card" key={story} ref={storyRef} data-type={t.type}>
                <p className="cx-story-meta">
                  <span>{String(story + 1).padStart(2, "0")} / {String(TIMELINE.length).padStart(2, "0")}</span>
                  <span>{t.type === "work" ? "WORK" : "EDUCATION"}</span>
                  {t.current && <span className="cx-story-now">● NOW</span>}
                </p>
                <p className={`cx-story-when cx-dot-type${t.when.length > 12 ? " is-long" : ""}`} data-scramble>{t.when}</p>
                <div className="cx-story-org">
                  {t.logo && <img src={t.logo} alt="" />}
                  <div>
                    <b data-scramble>{t.title}</b>
                    {t.url ? <a href={t.url} target="_blank" rel="noreferrer">{t.org} ↗</a> : <span>{t.org}</span>}
                  </div>
                </div>
                {t.note && <p className="cx-story-note">{t.note}</p>}
              </article>
            );
          })()}

          <div className="cx-prs">
            <h2 data-scramble>MERGED UPSTREAM · {prs.length || "…"} PRS</h2>
            <ol>
              {prs.slice(0, 8).map((x) => (
                <li key={x.url} ref={reveal} data-group="pr">
                  <a href={x.url} target="_blank" rel="noreferrer">
                    <span>{x.repo}#{x.number}</span>
                    <b>{x.title}</b>
                    <em>{ago(x.date)}</em>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section ref={reg("signal")} className="cx-panel cx-work cx-signal" aria-label="Live signal">
          <h2 className="cx-dot-type" data-scramble>SIGNAL</h2>
          <ol>
            {signalCards.map((c, i) => (
              <li key={c.label} className={i === sig ? "is-active" : ""}>
                <a href={c.href} target="_blank" rel="noreferrer">[{String(i + 1).padStart(2, "0")}] {c.label}</a>
              </li>
            ))}
          </ol>
          <div className="cx-work-detail" key={sig}>
            {sig < 0 ? (
              <p>Live from my side of the internet. Every card is pulled in real time{live.updated ? ` · synced ${ago(new Date(live.updated).toISOString()).toLowerCase()}` : ""}.</p>
            ) : (
              <>
                <p>{signalCards[sig].line}</p>
                <a href={signalCards[sig].href} target="_blank" rel="noreferrer">&gt; OPEN {signalCards[sig].label}</a>
              </>
            )}
          </div>
        </section>

        <section ref={reg("contact")} className="cx-panel cx-contact" aria-label="Contact">
          <div className="cx-contact-box">
            <h2 className="cx-dot-type" data-scramble>{config.contact.headline.split("\n").map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</h2>
            <p>{config.contact.sub}</p>
            <a className="cx-mail" href={`mailto:${config.person.email}`}>{config.person.email}</a>
            {config.contact.form && <a className="cx-send" href="/contact" onClick={openContact}>&gt; SEND A MESSAGE</a>}
            <ul>
              {SOCIALS.map((s) => (
                <li key={s.label}><a href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">&gt; {s.label}</a></li>
              ))}
            </ul>
          </div>
          <footer>
            <span>@{config.person.handle} everywhere</span>
            <span>{config.person.name} — all rights reserved</span>
            <span>©{year}</span>
          </footer>
        </section>
      </main>

      <div className={`cx-menu${menu ? " is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Menu" hidden={!menu}>
        <button type="button" className="cx-menu-close" onClick={() => setMenu(false)}>CLOSE ✕</button>
        <ol>
          {MENU.map((m, i) => (
            <li key={m.key}>
              <button type="button" className="cx-dot-type" onClick={() => go(m.key)}>
                <span>[{String(i).padStart(2, "0")}]</span>{m.label}
              </button>
            </li>
          ))}
          <li><Link href="/projects" className="cx-dot-type"><span>[→]</span>ALL PROJECTS</Link></li>
        </ol>
        <div className="cx-menu-foot">
          <p>
            <button type="button" className="cx-sfx-btn" onClick={() => setSfx(!sound)} aria-pressed={sound} aria-label={sound ? "Mute sound" : "Unmute sound"}><SoundIcon on={sound} /></button>
            {SOCIALS.map((s) => <a key={s.label} href={s.href} target="_blank" rel="noreferrer">{s.label}</a>)}
          </p>
        </div>
      </div>
      <ContactModal open={contact} onClose={closeContact} />
    </div>
  );
}
