import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import { MessageCircle, Github, Instagram, Linkedin, ExternalLink, ArrowRight, GraduationCap, Briefcase, Youtube } from "lucide-react";
import { usePageMeta } from "../lib/seo";
import { DitheredLogo } from "./DitheredLogo";
import { ParticleText } from "./ParticleText";
import { TextMorph } from "./TextMorph";
import { ScrollVelocityMarquee } from "./ScrollVelocityMarquee";
import { AnnotatedText } from "./AnnotatedText";
import { NewsletterBookshelf, type NewsletterBookshelfItem } from "./NewsletterBookshelf";
import { GH_USER, LANG_COLORS, type Repo } from "../lib/github";
import { SKILLS, CATEGORIES, type SkillCategory } from "../lib/skills";
import "./portfolio.css";

const MARQUEE_ITEMS = [
  "FULL-STACK DEVELOPER","BACKEND SPECIALIST","REVERSE ENGINEER","OPEN SOURCE CONTRIBUTOR","HLS PROXY SYSTEMS",
  "WEB SCRAPING & AUTOMATION","CRYPTOGRAPHY & SECURITY","CORE ONLINE",
  "FULL-STACK DEVELOPER","BACKEND SPECIALIST","REVERSE ENGINEER","OPEN SOURCE CONTRIBUTOR","HLS PROXY SYSTEMS",
  "WEB SCRAPING & AUTOMATION","CRYPTOGRAPHY & SECURITY","CORE ONLINE",
];

const MINI_MARQUEE = [
  "FULL-STACK DEVELOPER","BACKEND SPECIALIST","REVERSE ENGINEER","OPEN SOURCE","CRYPTOGRAPHY","CORE ONLINE",
  "FULL-STACK DEVELOPER","BACKEND SPECIALIST","REVERSE ENGINEER","OPEN SOURCE","CRYPTOGRAPHY","CORE ONLINE",
];

type JourneyEntry = {
  kind: "education" | "work";
  logo: string;
  title: string;
  org: string;
  url: string;
  period: string;
  status: "current" | "completed";
  detail: string;
  tags: string[];
};

const JOURNEY: JourneyEntry[] = [
  {
    kind: "work",
    logo: "/educations/nept.png",
    title: "Co-Founder & DevOps Engineer",
    org: "Nept Cloud",
    url: "https://nept.cloud",
    period: "May 2023 — Present",
    status: "current",
    detail: "Co-founded Nept Cloud — a developer-focused cloud platform for deploying and managing modern applications. Owning infrastructure, deployments, and developer tooling end-to-end.",
    tags: ["Self-Employed", "Co-Founder", "DevOps", "Cloud Infra"],
  },
  {
    kind: "education",
    logo: "/educations/college.png",
    title: "B.Tech, Computer Science & Engineering",
    org: "IILM University, Gurugram",
    url: "https://iilm.edu/gurugram/",
    period: "2026 — Present",
    status: "current",
    detail: "Pursuing Computer Science Engineering with focus on systems, networks, and applied software engineering.",
    tags: ["CSE", "Undergraduate"],
  },
  {
    kind: "education",
    logo: "/educations/school.png",
    title: "Class XII (CBSE) - PCM",
    org: "Apeejay School, Panchsheel Park",
    url: "https://www.apeejay.edu/panchsheel/",
    period: "2024 — 2025",
    status: "completed",
    detail: "Senior secondary, CBSE board. Final score: 7.7 CGPA.",
    tags: ["7.7 CGPA", "CBSE"],
  },
  {
    kind: "education",
    logo: "/educations/school.png",
    title: "Class X (CBSE)",
    org: "Apeejay School, Panchsheel Park",
    url: "https://www.apeejay.edu/panchsheel/",
    period: "2022 — 2023",
    status: "completed",
    detail: "Secondary school, CBSE board. Final score: 8.1 CGPA.",
    tags: ["8.1 CGPA", "CBSE"],
  },
];

const OSS_PRS = [
  { project: "Node.js", desc: "Removed unreachable conditionals in kFinishClose", pr: "#60235", url: "https://github.com/nodejs/node/pull/60235" },
  { project: "PreMiD Activities", desc: "Added new presence integration for Discord Rich Presence", pr: "#9391", url: "https://github.com/PreMiD/Activities/pull/9391" },
  { project: "FMHY", desc: "Added PWA Support to FreeMediaHeckYeah community project", pr: "#4094", url: "https://github.com/fmhy/edit/pull/4094" },
];

function useCounter(target: number, suffix: string, isVisible: boolean): string {
  const [val, setVal] = useState("0" + suffix);
  const started = useRef(false);
  useEffect(() => {
    if (!isVisible || started.current) return;
    started.current = true;
    const duration = 1800;
    let startTs: number | null = null;
    let raf: number;
    function step(ts: number) {
      if (!startTs) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target) + suffix);
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isVisible, target, suffix]);
  return val;
}

function MetricCard({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const numMatch = value.match(/^(\d+)(.*)$/);
  const num = numMatch ? parseInt(numMatch[1]) : 0;
  const suffix = numMatch ? numMatch[2] : "";
  const isStatic = !numMatch;
  const counted = useCounter(num, suffix, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => { setVisible(true); setRevealed(true); }, delay);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className="pf-metric-card"
      style={{
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      <span className="pf-metric-value">{isStatic ? value : counted}</span>
      <span className="pf-metric-label">{label}</span>
    </div>
  );
}

function ProjectShowcase() {
  const [items, setItems] = useState<NewsletterBookshelfItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/gh/users/${GH_USER}/repos?per_page=100&sort=updated`)
      .then(async (r) => { if (!r.ok) throw new Error(`GitHub ${r.status}`); return r.json(); })
      .then((data: Repo[]) => {
        if (cancelled) return;
        const mapped = data
          .filter((r) => !r.fork && !r.archived && !r.private)
          .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
          .slice(0, 14)
          .map<NewsletterBookshelfItem>((r) => ({
            id: String(r.id),
            title: r.name,
            date: new Date(r.pushed_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase(),
            subtitle: r.description || (r.language ? `${r.language} project` : "No description provided."),
            href: r.html_url,
          }));
        setItems(mapped);
      })
      .catch((err) => { if (!cancelled) setError(String(err.message || err)); });
    return () => { cancelled = true; };
  }, []);

  if (error && !items) return <p className="pf-repo-loading">⚠ {error}</p>;
  if (!items) return <p className="pf-repo-loading">SYNCING WITH GITHUB…</p>;
  if (items.length === 0) return <p className="pf-repo-loading">No repositories found.</p>;

  return <NewsletterBookshelf items={items}/>;
}

function SkillCarousel() {
  const [filter, setFilter] = useState<SkillCategory | "All">("All");
  const filtered = filter === "All" ? SKILLS : SKILLS.filter((s) => s.category === filter);
  const loop = [...filtered, ...filtered];

  return (
    <div className="pf-skill-deck">
      <div className="pf-skill-filters" data-reveal="true">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            className={`pf-skill-filter${filter === c ? " is-active" : ""}`}
            onClick={() => setFilter(c)}
            data-cursor-link
          >
            {c}
          </button>
        ))}
      </div>
      <div className="pf-skill-carousel" data-reveal="true">
        <div className="pf-skill-carousel-track" key={filter}>
          {loop.map((s, i) => (
            <div key={`${s.name}-${i}`} className="pf-skill-chip" title={s.name}>
              <div className="pf-skill-chip-icon">
                <img
                  src={s.icon}
                  alt={s.name}
                  draggable={false}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = "0.25";
                  }}
                />
              </div>
              <span className="pf-skill-chip-name">{s.name}</span>
              <span className="pf-skill-chip-cat">{s.category}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="pf-skill-carousel pf-skill-carousel-reverse" data-reveal="true" aria-hidden="true">
        <div className="pf-skill-carousel-track pf-skill-carousel-track-reverse" key={`r-${filter}`}>
          {[...loop].reverse().map((s, i) => (
            <div key={`r-${s.name}-${i}`} className="pf-skill-chip pf-skill-chip-mini">
              <div className="pf-skill-chip-icon">
                <img
                  src={s.icon}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = "0.25";
                  }}
                />
              </div>
              <span className="pf-skill-chip-name">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type LangBucket = { name: string; count: number; bytes: number; color: string };

function LanguageStats() {
  const [buckets, setBuckets] = useState<LangBucket[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/gh/users/${GH_USER}/repos?per_page=100&sort=updated`)
      .then((r) => r.json())
      .then((data: Repo[]) => {
        if (cancelled || !Array.isArray(data)) return;
        const tally = new Map<string, number>();
        data
          .filter((r) => !r.fork && !r.archived && !r.private && r.language)
          .forEach((r) => tally.set(r.language!, (tally.get(r.language!) || 0) + 1));
        const sorted = Array.from(tally.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([name, count]) => ({
            name,
            count,
            bytes: count,
            color: LANG_COLORS[name] || "#f4efe8",
          }));
        setBuckets(sorted);
      })
      .catch(() => { if (!cancelled) setBuckets([]); });
    return () => { cancelled = true; };
  }, []);

  const total = (buckets || []).reduce((s, b) => s + b.count, 0) || 1;

  return (
    <div className="pf-lang-stats" data-reveal="true">
      <div className="pf-lang-stats-head">
        <span className="pf-lang-stats-meta">{buckets ? `${buckets.length} languages · ${total} repos` : "SYNCING…"}</span>
      </div>
      <div className="pf-lang-stats-bar">
        {(buckets || []).map((b) => (
          <span
            key={b.name}
            className="pf-lang-stats-bar-seg"
            style={{ width: `${(b.count / total) * 100}%`, background: b.color }}
            title={`${b.name} — ${b.count} repos`}
          />
        ))}
      </div>
      <div className="pf-lang-stats-list">
        {(buckets || []).map((b) => (
          <div key={b.name} className="pf-lang-stats-row">
            <span className="pf-lang-stats-dot" style={{ background: b.color }} />
            <span className="pf-lang-stats-name">{b.name}</span>
            <span className="pf-lang-stats-count">{b.count}</span>
            <span className="pf-lang-stats-pct">{Math.round((b.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type ContribDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };
type ContribResp = { total: Record<string, number>; contributions: ContribDay[] };

function ContributionGraph() {
  const [data, setData] = useState<ContribResp | null>(null);
  const [error, setError] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; count: number; date: string } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`)
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then((j: ContribResp) => { if (!cancelled) setData(j); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div className="pf-contrib"><p className="pf-contrib-error">CONTRIB FEED UNREACHABLE</p></div>;
  if (!data) return <div className="pf-contrib"><p className="pf-contrib-loading">SYNCING WITH GITHUB…</p></div>;

  const days = data.contributions.slice(-371);
  const total = days.reduce((s, d) => s + d.count, 0);
  const busiest = days.reduce((m, d) => (d.count > m.count ? d : m), days[0]);

  const onCellEnter = (e: React.MouseEvent<HTMLSpanElement>, d: ContribDay) => {
    const cellRect = e.currentTarget.getBoundingClientRect();
    const gridRect = gridRef.current!.getBoundingClientRect();
    setTip({
      x: cellRect.left - gridRect.left + cellRect.width / 2,
      y: cellRect.top - gridRect.top,
      count: d.count,
      date: d.date,
    });
  };

  return (
    <div className="pf-contrib" data-reveal="true">
      <div className="pf-contrib-head">
        <p className="pf-contrib-title">GitHub Contributions · Last Year</p>
        <span className="pf-contrib-meta">
          <strong>{total}</strong> contributions · busiest day <strong>{busiest.count}</strong> on {busiest.date}
        </span>
      </div>
      <div
        ref={gridRef}
        className="pf-contrib-grid"
        role="img"
        aria-label={`${total} GitHub contributions in the last year`}
        onMouseLeave={() => setTip(null)}
      >
        {tip && (
          <div
            className="pf-contrib-tooltip"
            style={{ left: tip.x, top: tip.y }}
            role="tooltip"
          >
            <strong>{tip.count}</strong> contributions on {tip.date}
          </div>
        )}
        {days.map((d, i) => (
          <span
            key={d.date}
            className="pf-contrib-cell pf-contrib-cell-pop"
            data-level={d.level}
            style={{ animationDelay: `${i * 3}ms` }}
            onMouseEnter={(e) => onCellEnter(e, d)}
          />
        ))}
      </div>
      <div className="pf-contrib-legend">
        <span>Less</span>
        <div className="pf-contrib-legend-cells">
          {[0, 1, 2, 3, 4].map((l) => <span key={l} data-level={l} className="pf-contrib-cell" />)}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

function JourneyTimeline() {
  return (
    <div className="pf-journey">
      <div className="pf-journey-spine" aria-hidden="true" />
      {JOURNEY.map((j, i) => (
        <article
          key={`${j.org}-${j.period}`}
          className={`pf-journey-entry pf-journey-${j.kind}${j.status === "current" ? " is-current" : ""}`}
          data-reveal="true"
          style={{ transitionDelay: `${i * 0.08}s` }}
        >
          <div className="pf-journey-node" aria-hidden="true">
            {j.kind === "education" ? <GraduationCap size={14} /> : <Briefcase size={14} />}
          </div>
          <div className="pf-journey-period">
            <span>{j.period}</span>
            {j.status === "current" && <span className="pf-journey-current-dot" />}
          </div>
          <a
            href={j.url}
            target="_blank"
            rel="noreferrer"
            className="pf-journey-card"
            data-cursor-link
          >
            <div className="pf-journey-card-head">
              <div className="pf-journey-logo">
                <img src={j.logo} alt={j.org} draggable={false} />
              </div>
              <div className="pf-journey-meta">
                <span className="pf-journey-kind">{j.kind === "education" ? "Education" : "Work"}</span>
                <h3 className="pf-journey-title">{j.title}</h3>
                <span className="pf-journey-org">{j.org}</span>
              </div>
              <ExternalLink size={14} className="pf-journey-link-icon" />
            </div>
            <p className="pf-journey-detail">{j.detail}</p>
            <div className="pf-journey-tags">
              {j.tags.map((t) => <span key={t}>{t}</span>)}
            </div>
          </a>
        </article>
      ))}
    </div>
  );
}

function Preloader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let start: number | null = null;
    const duration = 1400;
    let raf: number;
    function step(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      setPct(Math.round(eased * 100));
      if (progress < 1) { raf = requestAnimationFrame(step); }
      else { setTimeout(() => { setDone(true); setTimeout(onDone, 700); }, 200); }
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className={`pf-preloader${done ? " is-done" : ""}`}>
      <div className="pf-preloader-panel pf-preloader-panel-left" />
      <div className="pf-preloader-panel pf-preloader-panel-right" />
      <div className="pf-preloader-grid" />
      <div className="pf-preloader-grain" />
      <div className="pf-preloader-scan" />
      <div className="pf-preloader-accent pf-preloader-accent-red" />
      <div className="pf-preloader-accent pf-preloader-accent-cyan" />
      <div className="pf-preloader-content">
        <div className="pf-preloader-brand-wrap">
          <div className="pf-preloader-brand">RISHAB</div>
        </div>
        <div className="pf-preloader-mini-marquee">
        </div>
        <div className="pf-preloader-progress-bottom">
          <div className="pf-preloader-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (matchMedia("(pointer: coarse)").matches) return;
    const el = ref.current;
    if (!el) return;

    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let x = tx, y = ty;
    let angle = 0, curAngle = 0;
    let scale = 1, curScale = 1;
    let visible = false;
    let raf = 0;

    function onMove(e: MouseEvent) {
      tx = e.clientX; ty = e.clientY;
      if (!visible) { visible = true; el!.classList.add("is-ready"); }
    }
    function onOver(e: MouseEvent) {
      if ((e.target as Element).closest("a,button,[data-cursor-link]")) scale = 1.55;
    }
    function onOut(e: MouseEvent) {
      if ((e.target as Element).closest("a,button,[data-cursor-link]")) scale = 1;
    }
    function onDown() { curScale *= 0.85; }
    function onLeave() { el!.classList.remove("is-ready"); visible = false; }
    function onEnter() { el!.classList.add("is-ready"); visible = true; }

    function animate() {
      const dx = tx - x, dy = ty - y;
      x += dx * 0.22; y += dy * 0.22;

      const speed = Math.hypot(dx, dy);
      if (speed > 2) {
        const target = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        let diff = target - angle;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        angle += diff;
      }
      curAngle += (angle - curAngle) * 0.25;
      curScale += (scale - curScale) * 0.18;

      el!.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${curAngle}deg) scale(${curScale})`;
      raf = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="pf-cursor" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="54" viewBox="0 0 50 54" fill="none">
        <path d="M42.6817 41.1495L27.5103 6.79925C26.7269 5.02557 24.2082 5.02558 23.3927 6.79925L7.59814 41.1495C6.75833 42.9759 8.52712 44.8902 10.4125 44.1954L24.3757 39.0496C24.8829 38.8627 25.4385 38.8627 25.9422 39.0496L39.8121 44.1954C41.6849 44.8902 43.4884 42.9759 42.6817 41.1495Z" fill="black" />
        <path d="M43.7146 40.6933L28.5431 6.34306C27.3556 3.65428 23.5772 3.69516 22.3668 6.32755L6.57226 40.6778C5.3134 43.4156 7.97238 46.298 10.803 45.2549L24.7662 40.109C25.0221 40.0147 25.2999 40.0156 25.5494 40.1082L39.4193 45.254C42.2261 46.2953 44.9254 43.4347 43.7146 40.6933Z" stroke="white" strokeWidth="2.2" />
      </svg>
    </div>
  );
}

type DiscordActivity = {
  id?: string; name: string; type: number; state?: string; details?: string; application_id?: string;
  timestamps?: { start?: number; end?: number };
  assets?: { large_image?: string; large_text?: string; small_image?: string; small_text?: string };
};
type LanyardData = {
  discord_user: { id: string; username: string; global_name: string | null; avatar: string | null; discriminator: string };
  discord_status: "online" | "idle" | "dnd" | "offline";
  activities: DiscordActivity[];
  listening_to_spotify: boolean;
  spotify: { track_id: string; timestamps: { start: number; end: number }; album: string; album_art_url: string; artist: string; song: string } | null;
};

const DISCORD_USER_ID = "1141729666160402565";
const LEETCODE_USERNAME = "rishabnotfound";
const STATUS_COLORS: Record<string, string> = {
  online: "#23a55a", idle: "#f0b232", dnd: "#f23f43", offline: "#80848e",
};
const STATUS_LABELS: Record<string, string> = {
  online: "ONLINE", idle: "IDLE", dnd: "DO NOT DISTURB", offline: "OFFLINE",
};

function resolveDiscordAsset(asset: string, applicationId?: string) {
  if (!asset) return "";
  if (asset.startsWith("mp:")) return asset.replace("mp:", "https://media.discordapp.net/");
  if (asset.startsWith("spotify:")) return `https://i.scdn.co/image/${asset.split(":")[1]}`;
  return `https://cdn.discordapp.com/app-assets/${applicationId || ""}/${asset}.png`;
}

function activityLabel(type: number) {
  switch (type) {
    case 0: return "Playing"; case 1: return "Streaming"; case 2: return "Listening to";
    case 3: return "Watching"; case 4: return "Custom Status"; case 5: return "Competing in";
    default: return "Playing";
  }
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function DiscordCard() {
  const [data, setData] = useState<LanyardData | null>(null);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_USER_ID}`);
        const json = await res.json();
        if (!cancelled) {
          if (json?.success && json.data) { setData(json.data); setError(false); }
          else setError(true);
        }
      } catch { if (!cancelled) setError(true); }
    }
    load();
    const poll = setInterval(load, 15000);
    const heartbeat = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { cancelled = true; clearInterval(poll); clearInterval(heartbeat); };
  }, []);

  void tick;

  if (error || !data) {
    return (
      <div className="pf-live-card pf-discord-card pf-live-card-empty">
        <div className="pf-live-header">
          <span className="pf-live-eyebrow">Discord Presence</span>
          <span className="pf-live-dot" style={{ background: STATUS_COLORS.offline }} />
        </div>
        <p className="pf-live-empty">PRESENCE OFFLINE — LANYARD UNREACHABLE</p>
      </div>
    );
  }

  const status = data.discord_status || "offline";
  const user = data.discord_user;
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${(parseInt(user.discriminator || "0") || 0) % 5}.png`;

  const activities = (data.activities || []).filter((a) => a.type !== 4);
  const customStatus = (data.activities || []).find((a) => a.type === 4);

  return (
    <div className="pf-live-card pf-discord-card" data-cursor-link>
      <div className="pf-live-header">
        <span className="pf-live-eyebrow">Discord Presence</span>
        <span className="pf-live-status">
          <span className="pf-live-dot" style={{ background: STATUS_COLORS[status] }} />
          <span>{STATUS_LABELS[status]}</span>
        </span>
      </div>
      <div className="pf-discord-identity">
        <div className="pf-discord-avatar-wrap">
          <img src={avatar} alt={user.username} className="pf-discord-avatar" draggable={false} />
          <span className="pf-discord-status-pill" style={{ background: STATUS_COLORS[status] }} />
        </div>
        <div className="pf-discord-meta">
          <span className="pf-discord-name">{user.global_name || user.username}</span>
          <span className="pf-discord-handle">@{user.username}</span>
          {customStatus?.state && <span className="pf-discord-bio">{customStatus.state}</span>}
        </div>
      </div>
      <div className="pf-discord-divider" />
      <div className="pf-discord-activities">
        {activities.length === 0 ? (
          <p className="pf-live-empty">NO ACTIVE SESSIONS</p>
        ) : activities.slice(0, 2).map((a, idx) => {
          const isSpotify = a.type === 2 && a.name === "Spotify";
          const large = a.assets?.large_image
            ? (isSpotify && a.assets.large_image.startsWith("spotify:")
                ? `https://i.scdn.co/image/${a.assets.large_image.split(":")[1]}`
                : resolveDiscordAsset(a.assets.large_image, a.application_id))
            : null;
          const small = a.assets?.small_image ? resolveDiscordAsset(a.assets.small_image, a.application_id) : null;
          const elapsed = a.timestamps?.start ? Date.now() - a.timestamps.start : null;
          const total = a.timestamps?.start && a.timestamps?.end ? a.timestamps.end - a.timestamps.start : null;
          const pct = elapsed != null && total ? Math.min(100, (elapsed / total) * 100) : null;
          return (
            <div key={a.id || idx} className="pf-activity-row">
              {large && (
                <div className="pf-activity-art">
                  <img src={large} alt={a.name} draggable={false} />
                  {small && <img src={small} alt="" className="pf-activity-art-small" draggable={false} />}
                </div>
              )}
              <div className="pf-activity-body">
                <span className="pf-activity-label">{a.type === 2 ? `Listening to ${a.name}` : activityLabel(a.type)}</span>
                <span className="pf-activity-title">{a.type === 2 ? (a.details || a.name) : a.name}</span>
                {a.type === 2 && a.state && <span className="pf-activity-sub">by {a.state}</span>}
                {a.type !== 2 && a.details && <span className="pf-activity-sub">{a.details}</span>}
                {a.type !== 2 && a.state && <span className="pf-activity-sub">{a.state}</span>}
                {pct != null ? (
                  <div className="pf-activity-progress">
                    <div className="pf-activity-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                ) : elapsed != null ? (
                  <span className="pf-activity-elapsed">{formatElapsed(elapsed)} elapsed</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type LeetCodeData = {
  totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number;
  totalQuestions: number; totalEasy: number; totalMedium: number; totalHard: number;
  ranking: number;
};

function LeetCodeCard() {
  const [data, setData] = useState<LeetCodeData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leetcode?username=${encodeURIComponent(LEETCODE_USERNAME)}`)
      .then((r) => r.json())
      .then((j) => { if (!cancelled) { if (j && typeof j.totalSolved === "number") setData(j); else setError(true); } })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="pf-live-card pf-leetcode-card pf-live-card-empty">
        <div className="pf-live-header">
          <span className="pf-live-eyebrow">LeetCode</span>
          <span className="pf-live-dot" style={{ background: STATUS_COLORS.offline }} />
        </div>
        <p className="pf-live-empty">STATS UNREACHABLE</p>
      </div>
    );
  }

  const loading = !data;
  const totalPct = data ? Math.min(100, (data.totalSolved / Math.max(data.totalQuestions, 1)) * 100) : 0;
  const buckets = [
    { key: "Easy", solved: data?.easySolved ?? 0, total: data?.totalEasy ?? 0, color: "var(--cyan)" },
    { key: "Medium", solved: data?.mediumSolved ?? 0, total: data?.totalMedium ?? 0, color: "var(--gold)" },
    { key: "Hard", solved: data?.hardSolved ?? 0, total: data?.totalHard ?? 0, color: "var(--red)" },
  ];

  return (
    <a
      href={`https://leetcode.com/u/${LEETCODE_USERNAME}`}
      target="_blank"
      rel="noreferrer"
      className="pf-live-card pf-leetcode-card"
      data-cursor-link
    >
      <div className="pf-live-header">
        <span className="pf-live-eyebrow">LeetCode</span>
        <span className="pf-live-status">
          <span className="pf-live-dot" style={{ background: "var(--gold)" }} />
          <span>@{LEETCODE_USERNAME}</span>
        </span>
      </div>
      <div className="pf-leetcode-headline">
        <span className="pf-leetcode-total">{loading ? "—" : data!.totalSolved}</span>
        <span className="pf-leetcode-total-label">Problems Solved</span>
        <span className="pf-leetcode-rank">
          Global Rank <strong>#{loading ? "—" : data!.ranking.toLocaleString()}</strong>
        </span>
      </div>
      <div className="pf-leetcode-progress-wrap">
        <div className="pf-leetcode-progress-track">
          <div className="pf-leetcode-progress-fill" style={{ width: `${totalPct}%` }} />
        </div>
        <span className="pf-leetcode-progress-meta">
          {loading ? "—" : `${data!.totalSolved} / ${data!.totalQuestions}`}
        </span>
      </div>
      <div className="pf-leetcode-buckets">
        {buckets.map((b) => {
          const pct = b.total ? Math.min(100, (b.solved / b.total) * 100) : 0;
          return (
            <div key={b.key} className="pf-leetcode-bucket">
              <div className="pf-leetcode-bucket-head">
                <span className="pf-leetcode-bucket-label">{b.key}</span>
                <span className="pf-leetcode-bucket-count">{loading ? "—" : `${b.solved}/${b.total}`}</span>
              </div>
              <div className="pf-leetcode-bucket-track">
                <div className="pf-leetcode-bucket-fill" style={{ width: `${pct}%`, background: b.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </a>
  );
}

export function Portfolio() {
  usePageMeta({
    title: "Rishab — Full-Stack Developer, Backend Specialist & Reverse Engineer",
    description: "Rishab — full-stack developer and backend specialist from Delhi, India. HLS proxies, dev tooling, reverse-engineered systems, open-source contributions to Node.js, PreMiD, and FMHY.",
    path: "/",
  });
  const [ready, setReady] = useState(false);
  const [activeChapter, setActiveChapter] = useState("hero");
  const [konami, setKonami] = useState(false);
  const navLinksRef = useRef<HTMLDivElement>(null);
  const navProgressRef = useRef<HTMLSpanElement>(null);
  const heroWordRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const onPreloaderDone = useCallback(() => setReady(true), []);

  useEffect(() => {
    if (!ready) return;
    const word = heroWordRef.current;
    const sub = heroSubRef.current;
    if (word) {
      requestAnimationFrame(() => {
        word.style.transition = "opacity 1s cubic-bezier(0.16,1,0.3,1), transform 1s cubic-bezier(0.16,1,0.3,1)";
        word.style.opacity = "1";
        word.style.transform = "none";
      });
    }
    if (sub) {
      setTimeout(() => {
        sub.style.transition = "opacity 0.9s cubic-bezier(0.16,1,0.3,1) 0.18s, transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.18s";
        sub.style.opacity = "1";
        sub.style.transform = "none";
      }, 60);
    }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    let rafScheduled = false;
    function updateProgress() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      if (navProgressRef.current) navProgressRef.current.style.width = pct + "%";
    }
    function onScroll() {
      if (rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(() => {
        updateProgress();
        rafScheduled = false;
      });
    }
    function onAnchorClick(e: MouseEvent) {
      const a = (e.target as Element).closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - 60;
      window.scrollTo({ top, behavior: "smooth" });
    }

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onAnchorClick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onAnchorClick);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const sections = document.querySelectorAll("[data-chapter]");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveChapter((e.target as HTMLElement).dataset.chapter || "");
        });
      },
      { threshold: 0.25 }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [ready]);

  useEffect(() => {
    const container = navLinksRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLAnchorElement>("a.is-active");
    if (!active) return;
    const cRect = container.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    const offset = aRect.left - cRect.left - (cRect.width / 2 - aRect.width / 2);
    container.scrollTo({ left: container.scrollLeft + offset, behavior: "smooth" });
  }, [activeChapter]);

  useEffect(() => {
    const seq = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","b","a"];
    let idx = 0;
    function onKey(e: KeyboardEvent) {
      const want = seq[idx];
      if (e.key === want || e.key.toLowerCase() === want.toLowerCase()) {
        idx++;
        if (idx === seq.length) { setKonami(true); idx = 0; setTimeout(() => setKonami(false), 4000); }
      } else idx = 0;
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    els.forEach((el) => {
      const parent = el.parentElement;
      if (!parent) return;
      const siblings = Array.from(parent.querySelectorAll(":scope > [data-reveal]"));
      const idx = siblings.indexOf(el as Element);
      const existing = parseFloat((el as HTMLElement).style.transitionDelay || "0") * 1000;
      if (idx > 0 && existing === 0) {
        (el as HTMLElement).style.transitionDelay = `${idx * 0.12}s`;
      }
    });
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-visible"); }); },
      { threshold: 0.1 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ready]);

  const chapters = [
    { id: "hero", label: "Hero" },
    { id: "about", label: "About" },
    { id: "numbers", label: "Numbers" },
    { id: "live", label: "Live" },
    { id: "projects", label: "Projects" },
    { id: "oss", label: "OSS" },
    { id: "journey", label: "Journey" },
    { id: "skills", label: "Skills" },
    { id: "contact", label: "Contact" },
  ];

  return (
    <div className={`pf-root${konami ? " pf-konami" : ""}`}>
      {konami && <div className="pf-konami-toast">↑ ↑ ↓ ↓ ← → ← → B A — CHEAT MODE ACTIVATED</div>}
      <Preloader onDone={onPreloaderDone} />
      <Cursor />

      <nav className={`pf-chapter-nav${ready ? " is-ready" : ""}`} aria-label="Chapter navigation">
        <a href="#hero" className="pf-chapter-nav-brand" data-cursor-link>
          <img src="/nobg.png" alt="Rishab" />
          <span>RISHAB</span>
        </a>
        <div className="pf-chapter-nav-links" ref={navLinksRef}>
          {chapters.map((c, i) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              className={activeChapter === c.id ? "is-active" : ""}
              data-cursor-link
            >
              <span>{String(i).padStart(2, "0")}</span>
              <span>{c.label}</span>
            </a>
          ))}
        </div>
        <a
          href="https://github.com/rishabnotfound"
          target="_blank"
          rel="noreferrer"
          className="pf-chapter-nav-cta"
          data-cursor-link
        >
          <Github size={12} aria-hidden="true" />
          <span>GitHub</span>
        </a>
        <span
          ref={navProgressRef}
          className="pf-chapter-nav-progress"
          aria-hidden="true"
        />
      </nav>

      <div className={`pf-shell${ready ? " is-ready" : ""}`}>

        <section id="hero" data-chapter="hero" className="pf-hero">
          <div className="pf-hero-layout">
            <div className="pf-hero-copy">
              <h1
                ref={heroWordRef}
                className="pf-hero-word"
                style={{ opacity: 0, transform: "translateY(80px) rotateX(16deg)" }}
                aria-label="RISHAB"
              >
                <span className="pf-visually-hidden">RISHAB</span>
                <ParticleText
                  text="RISHAB"
                  color="#f4efe8"
                  fontSize={340}
                  particleSize={1.6}
                  particleDensity={5}
                  dispersionStrength={18}
                  returnSpeed={0.08}
                  fontFamily='"Space Grotesk", "Inter", sans-serif'
                />
              </h1>
              <p
                ref={heroSubRef}
                className="pf-hero-subtitle"
                style={{ opacity: 0, transform: "translateY(30px)" }}
              >
                <span className="pf-hero-morph">
                  <span className="pf-hero-morph-prefix" aria-hidden="true">~</span>
                  <TextMorph
                    words={[
                      "FULL-STACK DEV",
                      "BACKEND SPECIALIST",
                      "REVERSE ENGINEER",
                      "OPEN SOURCE DEVELOPER",
                    ]}
                    interval={2400}
                    morphDuration={720}
                  />
                </span>
              </p>
            </div>
            <div className="pf-hero-visual" data-reveal="true" aria-label="Dithered portrait of Rishab">
              <div className="pf-dither-wrap">
                <DitheredLogo
                  imageSrc="/profile.svg"
                  particleColor="#f4efe8"
                  className="pf-dither"
                  gridSize={220}
                  scale={0.95}
                  dotScale={1}
                  invert={false}
                  cornerRadius={0.18}
                  threshold={128}
                  contrast={20}
                  blur={2.5}
                />
              </div>
            </div>
          </div>
          <div className="pf-marquee" aria-hidden="true">
            <ScrollVelocityMarquee
              text="FULL-STACK DEVELOPER  •  BACKEND SPECIALIST  •  REVERSE ENGINEER  •  OPEN SOURCE CONTRIBUTOR  •  HLS PROXY SYSTEMS  •  WEB SCRAPING & AUTOMATION  •  CRYPTOGRAPHY & SECURITY  •  CORE ONLINE"
              defaultVelocity={1.5}
              className="pf-marquee-track"
            />
          </div>
        </section>

        <section id="about" data-chapter="about" className="pf-chapter pf-about-section">
          <div className="pf-section-shell">
            <p className="pf-chapter-label" data-reveal="true">01 / About</p>
            <div className="pf-about-grid">
              <h2 data-reveal="true">BETTER AT <AnnotatedText variant="circle">BREAKING</AnnotatedText> HOW THINGS WORK.</h2>
              <div className="pf-about-copy" data-reveal="true">
                <p>I&apos;m Rishab — a full-stack developer (frontend + backend + DevOps) with a backend specialty, based in Delhi. I like breaking systems open to see what makes them tick, then rebuilding them cleaner.</p>
                <p>Day-to-day I work on HLS proxy infrastructure, reverse engineering, web scraping &amp; automation, cryptography, and MongoDB tooling. I ship publicly as <code>@rishabnotfound</code> and contribute upstream to <a href="https://github.com/nodejs/node/pull/60235" target="_blank" rel="noreferrer" data-cursor-link>Node.js</a>, <a href="https://github.com/PreMiD/Activities/pull/9391" target="_blank" rel="noreferrer" data-cursor-link>PreMiD</a>, and <a href="https://github.com/fmhy/edit/pull/4094" target="_blank" rel="noreferrer" data-cursor-link>FMHY</a>.</p>
                <p>On the side I co-founded <a href="https://nept.cloud" target="_blank" rel="noreferrer" data-cursor-link>Nept Cloud</a>, and I&apos;m studying B.Tech CSE at IILM University, Gurugram.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="numbers" data-chapter="numbers" className="pf-chapter pf-numbers-section">
          <div className="pf-section-shell">
            <p className="pf-chapter-label" data-reveal="true">02 / Numbers</p>
            <div className="pf-metrics-grid">
              <MetricCard value="27"  label="Public GitHub Repos"       delay={0} />
              <MetricCard value="82"  label="GitHub Followers"          delay={100} />
              <MetricCard value="60+" label="Total Stars Earned"        delay={200} />
              <MetricCard value="3"   label="OSS PRs Merged to Major Projects" delay={300} />
            </div>
          </div>
        </section>

        <section id="live" data-chapter="live" className="pf-chapter pf-live-section">
          <div className="pf-section-shell">
            <p className="pf-chapter-label" data-reveal="true">03 / Live Signal</p>
            <h2 className="pf-live-heading" data-reveal="true"><AnnotatedText variant="underline">REALTIME</AnnotatedText> — PRESENCE &amp; PRACTICE.</h2>
            <div className="pf-live-grid">
              <div data-reveal="true"><DiscordCard /></div>
              <div data-reveal="true"><LeetCodeCard /></div>
            </div>
          </div>
        </section>

        <section id="projects" data-chapter="projects" className="pf-chapter">
          <div className="pf-section-shell">
            <div className="pf-section-heading">
              <p className="pf-chapter-label" data-reveal="true">04 / Projects</p>
              <h2 data-reveal="true">Systems that feel <AnnotatedText variant="wavy">sharp</AnnotatedText> before they speak.</h2>
            </div>
            <ProjectShowcase />
            <div className="pf-projects-cta" data-reveal="true">
              <Link href="/projects" className="pf-projects-cta-btn" data-cursor-link>
                <span>See All Projects</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section id="oss" data-chapter="oss" className="pf-chapter pf-about-section">
          <div className="pf-section-shell">
            <p className="pf-chapter-label" data-reveal="true">05 / Open Source</p>
            <h2 data-reveal="true">CONTRIBUTING TO THE <AnnotatedText variant="circle">COMMONS</AnnotatedText>.</h2>
            <div className="pf-oss-grid">
              {OSS_PRS.map((pr, i) => (
                <a
                  key={i}
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="pf-oss-card"
                  data-reveal="true"
                  data-cursor-link
                >
                  <div className="pf-oss-header">
                    <span className="pf-oss-project">{pr.project}</span>
                    <span className="pf-oss-badge">MERGED</span>
                  </div>
                  <p className="pf-oss-desc">{pr.desc}</p>
                  <div className="pf-oss-footer">
                    <span className="pf-oss-pr">PR {pr.pr}</span>
                    <ExternalLink size={14} />
                  </div>
                </a>
              ))}
            </div>
            <div style={{ marginTop: "2rem" }}>
              <ContributionGraph />
            </div>
          </div>
        </section>

        <section id="journey" data-chapter="journey" className="pf-chapter pf-journey-section">
          <div className="pf-section-shell">
            <div className="pf-section-heading">
              <p className="pf-chapter-label" data-reveal="true">06 / Journey</p>
              <h2 data-reveal="true">EDUCATION &amp; WORK — <AnnotatedText variant="box">TRAJECTORY</AnnotatedText> ON RECORD.</h2>
            </div>
            <JourneyTimeline />
          </div>
        </section>

        <section id="skills" data-chapter="skills" className="pf-chapter pf-skills-section">
          <div className="pf-section-shell">
            <p className="pf-chapter-label" data-reveal="true">07 / Skills</p>
            <div className="pf-skill-layout">
              <h2 data-reveal="true">Tools <AnnotatedText variant="underline">sharpened</AnnotatedText> for backend, scraping, and reverse engineering.</h2>
              <LanguageStats />
            </div>
            <SkillCarousel />
          </div>
        </section>

        <section id="contact" data-chapter="contact" className="pf-contact-section">
          <div className="pf-contact-panel" data-reveal="true">
            <p className="pf-chapter-label">08 / Contact</p>
            <h2>LET'S BUILD SOMETHING TOGETHER</h2>
            <div className="pf-contact-actions">
              <a href="https://github.com/rishabnotfound" target="_blank" rel="noreferrer" data-cursor-link>
                <Github size={18} aria-hidden="true" />
                <span>GitHub</span>
              </a>
              <a href="https://linkedin.com/in/rishabnotfound" target="_blank" rel="noreferrer" data-cursor-link>
                <Linkedin size={18} aria-hidden="true" />
                <span>LinkedIn</span>
              </a>
              <a href="https://leetcode.com/u/rishabnotfound/" target="_blank" rel="noreferrer" data-cursor-link>
                <svg role="img" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/></svg>
                <span>LeetCode</span>
              </a>
              <a href="https://tryhackme.com/p/rishabnotfound" target="_blank" rel="noreferrer" data-cursor-link>
                <svg role="img" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M11.8307.0006C9.3399.0247 6.9802 1.349 5.6831 3.541c-.4775-.1719-.9845-.2611-1.4945-.2629-2.3105 0-4.1885 1.8765-4.1885 4.187a4.1928 4.1928 0 0 0 1.5709 3.2696L12 21l10.4297-10.331a4.1928 4.1928 0 0 0 1.5703-3.2683c0-2.3105-1.879-4.187-4.1895-4.187-.51.0018-1.016.091-1.4935.263C16.9226 1.3104 14.4435-.0245 11.8307.0006Zm-.4 4.5938c.2362-.0001.4727.0467.694.1406l3.4843 1.4814a1.7686 1.7686 0 0 1 1.0762 1.6133v.0156l-.0098 2.3438a.6075.6075 0 0 1-.0117.1132.6075.6075 0 0 1-.039.1075.6075.6075 0 0 1-.0567.0976.6075.6075 0 0 1-.0742.0879.6075.6075 0 0 1-.0879.0703.6075.6075 0 0 1-.0976.0547.6075.6075 0 0 1-.1075.039.6075.6075 0 0 1-.5469-.1015L13.832 9.7748a.6075.6075 0 0 1-.084-.078.6075.6075 0 0 1-.0644-.0917.6075.6075 0 0 1-.0469-.1016.6075.6075 0 0 1-.0273-.107.6075.6075 0 0 1-.0079-.1094.6075.6075 0 0 1 .0118-.1094.6075.6075 0 0 1 .0312-.1054.6075.6075 0 0 1 .0508-.0996.6075.6075 0 0 1 .0664-.09l1.5469-1.6661-3.207-1.3633-3.213 1.3633 1.5468 1.666a.6075.6075 0 0 1 .121.1898.6075.6075 0 0 1 .0429.2207.6075.6075 0 0 1-.0078.1094.6075.6075 0 0 1-.0273.1074.6075.6075 0 0 1-.047.1016.6075.6075 0 0 1-.0644.0918.6075.6075 0 0 1-.084.078L7.5392 11.123a.6075.6075 0 0 1-.0996.0567.6075.6075 0 0 1-.1074.039.6075.6075 0 0 1-.1133.0117.6075.6075 0 0 1-.1132-.0117.6075.6075 0 0 1-.1075-.039.6075.6075 0 0 1-.0976-.0547.6075.6075 0 0 1-.088-.0703.6075.6075 0 0 1-.0741-.088.6075.6075 0 0 1-.0567-.0976.6075.6075 0 0 1-.039-.1074.6075.6075 0 0 1-.0117-.1133L6.7253 7.974v-.0118a1.7686 1.7686 0 0 1 1.0762-1.6133l3.4863-1.4814c.2213-.0939.4559-.1407.682-.1406z"/></svg>
                <span>TryHackMe</span>
              </a>
              <a href="https://codeforces.com/profile/rishabnotfound" target="_blank" rel="noreferrer" data-cursor-link>
                <svg role="img" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4.5 7.5A1.5 1.5 0 0 1 6 9v10.5A1.5 1.5 0 0 1 4.5 21h-3C.673 21 0 20.328 0 19.5V9c0-.828.673-1.5 1.5-1.5h3zm9 -3A1.5 1.5 0 0 1 15 6v13.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 19.5V6a1.5 1.5 0 0 1 1.5-1.5h3zm9 6A1.5 1.5 0 0 1 24 12v7.5a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5V12a1.5 1.5 0 0 1 1.5-1.5h3z"/></svg>
                <span>Codeforces</span>
              </a>
              <a href="https://instagram.com/rishabnotfound" target="_blank" rel="noreferrer" data-cursor-link>
                <Instagram size={18} aria-hidden="true" />
                <span>Instagram</span>
              </a>
              <a href="https://x.com/rishabnotfound" target="_blank" rel="noreferrer" data-cursor-link>
                <svg role="img" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                <span>X</span>
              </a>
               <a href="https://youtube.com/@rishabnotfound" target="_blank" rel="noreferrer" data-cursor-link>
                <Youtube size={18} aria-hidden="true" />
                <span>Youtube</span>
              </a>
              <a href="https://discord.com/users/1141729666160402565" target="_blank" rel="noreferrer" data-cursor-link>
                <MessageCircle size={18} aria-hidden="true" />
                <span>Discord</span>
              </a>
            </div>
            <p className="pf-contact-username">@rishabnotfound everywhere</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Portfolio;
