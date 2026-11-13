import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "../lib/seo";
import { startEngine, type Frame } from "./engine";
import { buildTimeline, smooth, type ChapterKey, type Timeline } from "./timeline";
import { workFocus } from "./scenes/work";
import { weekAt, weekSummary } from "./scenes/commits";
import { signalFocus } from "./scenes/signal";
import { SOCIALS, GH, BORN, TIMELINE, LINKEDIN, DISCORD_ID, type Project } from "./data";
import { config } from "../config";
import { startLive, loadFeatured, useLive, getLive, contribStats, ago } from "./feed";
import { ContactModal } from "./ContactModal";
import "./cinema.css";

type Win = { key: ChapterKey; a: number; b: number; drift?: number };

const PANELS: Win[] = [
  { key: "hero", a: -1, b: 0.5 },
  { key: "work", a: 0.0, b: 0.9 },
  { key: "about", a: 0.04, b: 0.8, drift: 0.35 },
  { key: "commits", a: 0.08, b: 0.82 },
  { key: "journey", a: 0.04, b: 0.8 },
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
  { key: "commits", label: "COMMITS" }, { key: "journey", label: "JOURNEY" }, { key: "signal", label: "SIGNAL" },
  { key: "contact", label: "CONTACT" },
];

const STATUS_COLOR: Record<string, string> = { online: "#22ff00", idle: "#ffd000", dnd: "#ff3344", offline: "#7a7a7a" };

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
  const [light, setLight] = useState(false);
  const [menu, setMenu] = useState(false);
  const [contact, setContact] = useState(() => !!config.contact.form && location.pathname === "/contact");
  const live = useLive();
  const tl = useMemo(() => (projects ? buildTimeline(projects.length) : null), [projects]);

  useEffect(() => {
    startLive();
    loadFeatured().then(setProjects);
  }, []);

  useEffect(() => {
    if (!projects || !tl) return;
    document.documentElement.classList.add("cx-html");
    let stop: (() => void) | undefined;
    let cancelled = false;
    let lastActive = -1, lastLight = false, lastWeek = -1, lastSig = -2;
    const workI = tl.index("work"), aboutI = tl.index("about"), commitsI = tl.index("commits"), journeyI = tl.index("journey"), signalI = tl.index("signal");
    const minDelay = new Promise((r) => setTimeout(r, 900));

    startEngine(canvasRef.current!, projects, tl, (f) => {
      for (const w of PANELS) {
        const el = panels.current[w.key];
        if (!el) continue;
        const o = opacityFor(f, w, tl);
        el.style.opacity = String(o);
        el.style.visibility = o > 0.01 ? "visible" : "hidden";
        const glitchX = f.velocity > 0.8 ? (Math.random() - 0.5) * 6 : 0;
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
        for (const el of lines) {
          const text = el.dataset.text ?? "";
          const n = Math.max(0, Math.min(text.length, Math.floor(budget)));
          budget -= text.length;
          if (el.textContent?.length !== n) el.textContent = text.slice(0, n);
          el.classList.toggle("is-typing", n > 0 && n < text.length);
        }
      }
      if (f.i === journeyI) {
        const mobile = innerWidth <= 760;
        const panel = panels.current.journey;
        if (panel) panel.dataset.phase = mobile && f.lp >= 0.44 ? "prs" : "timeline";
        const steps = revealRef.current.filter((el) => el.dataset.group === "tl");
        const pr = revealRef.current.filter((el) => el.dataset.group === "pr");
        steps.forEach((el, k) => el.classList.toggle("is-on", f.lp > 0.06 + (k / steps.length) * (mobile ? 0.3 : 0.25)));
        pr.forEach((el, k) => el.classList.toggle("is-on", f.lp > (mobile ? 0.46 : 0.3) + (k / pr.length) * 0.25));
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
        <span className="cx-dot-type">LOADING</span>
        <span className="cx-loader-pill"><i /></span>
      </div>

      <header className="cx-head">
        <a href="#" className="cx-brand cx-dot-type" onClick={(e) => { e.preventDefault(); go("hero"); }}>{config.person.name}</a>
        <nav className="cx-head-right">
          <a href={contactHref} onClick={openContact} className="cx-talk" title={live.presence ? `Discord: ${live.presence.status}` : undefined}>
            LET&apos;S TALK<i style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
          </a>
          <button type="button" className="cx-menu-btn" onClick={() => setMenu(true)} aria-expanded={menu}>
            MENU<span aria-hidden="true">☰</span>
          </button>
        </nav>
      </header>

      <main className="cx-panels">
        <section ref={reg("hero")} className="cx-panel cx-hero" aria-label="Intro">
          <div className="cx-hero-name">
            <h1 className="cx-dot-type">{config.person.name}</h1>
            <p><span>{config.hero.tag}</span><span>©{year}</span></p>
          </div>
          <p className="cx-hero-blurb">{config.hero.blurb}</p>
          <p className="cx-scroll-hint">SCROLL ↓</p>
        </section>

        {projects && p && (
          <section ref={reg("work")} className="cx-panel cx-work" aria-label="Selected work">
            <h2 className="cx-dot-type">SELECTED WORK</h2>
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

        <section ref={reg("commits")} className="cx-panel cx-commits" aria-label="Contributions">
          <p className="cx-commits-week"><span ref={weekRef}>SYNCING…</span></p>
          <div className="cx-commits-main">
            <p className="cx-commits-total cx-dot-type">{live.contribTotal?.toLocaleString("en-US") ?? "—"}</p>
            <p className="cx-commits-label">CONTRIBUTIONS IN THE LAST 12 MONTHS</p>
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

        <section ref={reg("journey")} className="cx-panel cx-journey" aria-label="Journey">
          <div className="cx-journey-col">
            <h2>JOURNEY</h2>
            <ol className="cx-timeline">
              {TIMELINE.map((t) => (
                <li key={`${t.when}${t.org}`} ref={reveal} data-group="tl">
                  {t.logo && <img src={t.logo} alt="" className="cx-tl-logo" loading="lazy" />}
                  <span>{t.when}</span>
                  {t.url ? <a href={t.url} target="_blank" rel="noreferrer">{t.title} · {t.org}</a> : <b>{t.title} · {t.org}</b>}
                  <em>{t.note}</em>
                </li>
              ))}
            </ol>
          </div>
          <div className="cx-journey-col cx-prs">
            <h2>MERGED UPSTREAM · {prs.length || "…"} PRS</h2>
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
          <h2 className="cx-dot-type">SIGNAL</h2>
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
            <h2 className="cx-dot-type">{config.contact.headline.split("\n").map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</h2>
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
            <i style={{ background: dot }} /> DISCORD {live.presence ? live.presence.status.toUpperCase() : "…"}
            {live.presence?.activity ? ` — ${live.presence.activity}` : ""}
          </p>
          <p>{SOCIALS.map((s) => <a key={s.label} href={s.href} target="_blank" rel="noreferrer">{s.label}</a>)}</p>
        </div>
      </div>
      <ContactModal open={contact} onClose={closeContact} />
    </div>
  );
}
