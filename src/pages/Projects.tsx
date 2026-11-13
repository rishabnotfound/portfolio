import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "../lib/seo";
import { config } from "../config";
import { GH_USER, LANG_COLORS, fetchReadmePreview, timeAgo, type Repo } from "../lib/github";
import { toProject } from "../cinema/feed";
import { screenPainter, SW, SH } from "../cinema/screens";
import { startSwarm } from "./swarm";
import "../cinema/cinema.css";
import "./projects.css";

type Sort = "recent" | "stars" | "name";
type Preview = { repo: Repo; img?: string | null };

const params = () => new URLSearchParams(location.search);

function frameSize(ratio: number) {
  const r = Math.min(2.4, Math.max(0.56, ratio));
  return r >= 1 ? { width: 400, aspectRatio: String(r) } : { width: Math.round(360 * r), aspectRatio: String(r) };
}

function Screen({ repo, img }: Preview) {
  const ref = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const { paint } = useMemo(() => screenPainter(toProject(repo)), [repo]);
  const painted = img === null || failed;

  useEffect(() => {
    if (!img) return;
    setRatio(null);
    setFailed(false);
    let raf = 0;
    const tick = () => {
      const im = imgRef.current;
      if (!im) return;
      if (im.naturalWidth) setRatio(im.naturalWidth / im.naturalHeight);
      else if (im.complete) setFailed(true);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [img]);

  useEffect(() => {
    if (!painted) return;
    const cv = ref.current!;
    const g = cv.getContext("2d")!;
    const t0 = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      g.setTransform(cv.width / SW, 0, 0, cv.height / SH, 0, 0);
      paint(g, (now - t0) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paint, painted]);

  return (
    <div className="cx-archive-frame" style={frameSize(!painted && ratio ? ratio : SW / SH)}>
      {painted ? (
        <canvas ref={ref} width={SW / 2} height={SH / 2} />
      ) : (
        <>
          {img && <img ref={imgRef} src={img} alt="" style={{ opacity: ratio ? 1 : 0 }} onError={() => setFailed(true)} />}
          {!ratio && <div className="cx-archive-loading">LOADING README…</div>}
        </>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  usePageMeta({
    title: `All Projects — ${config.person.name}`,
    description: `Complete archive of ${config.person.name}'s public work — every public GitHub repository, live, with previews.`,
    path: "/projects",
  });
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(() => params().get("q") ?? "");
  const [lang, setLang] = useState(() => params().get("lang") ?? "");
  const [sort, setSort] = useState<Sort>(() => (params().get("sort") as Sort) || "recent");
  const [preview, setPreview] = useState<Preview | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const loaded = !!repos;

  useEffect(() => {
    window.scrollTo(0, 0);
    let dead = false;
    fetch(`/api/gh/users/${GH_USER}/repos?per_page=100&sort=updated`)
      .then(async (r) => { if (!r.ok) throw new Error(`GITHUB ${r.status}`); return r.json(); })
      .then((d: Repo[]) => !dead && setRepos(d.filter((r) => !r.fork && !r.archived && !r.private && r.name.toLowerCase() !== GH_USER.toLowerCase())))
      .catch((e) => !dead && setError(String(e.message || e)));
    return () => { dead = true; };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (lang) p.set("lang", lang);
    if (sort !== "recent") p.set("sort", sort);
    history.replaceState(null, "", `/projects${p.size ? `?${p}` : ""}`);
  }, [query, lang, sort]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el || matchMedia("(pointer: coarse)").matches) return;
    let px = 0, py = 0;
    const place = () => {
      const x = Math.min(px + 28, innerWidth - el.offsetWidth - 16);
      const y = Math.max(16, Math.min(py - el.offsetHeight / 2, innerHeight - el.offsetHeight - 16));
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; place(); };
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); ro.disconnect(); };
  }, []);

  useEffect(() => (loaded && mainRef.current ? startSwarm(mainRef.current) : undefined), [loaded]);

  const langs = useMemo(() => {
    const m = new Map<string, number>();
    (repos ?? []).forEach((r) => r.language && m.set(r.language, (m.get(r.language) ?? 0) + 1));
    return [...m].sort((a, b) => b[1] - a[1]);
  }, [repos]);

  const list = useMemo(() => {
    if (!repos) return [];
    const q = query.trim().toLowerCase();
    const out = repos.filter((r) =>
      (!lang || r.language === lang) &&
      (!q || [r.name, r.description ?? "", r.language ?? "", ...(r.topics ?? [])].some((s) => s.toLowerCase().includes(q))));
    if (sort === "stars") out.sort((a, b) => b.stargazers_count - a.stargazers_count);
    else if (sort === "name") out.sort((a, b) => a.name.localeCompare(b.name));
    else out.sort((a, b) => +new Date(b.pushed_at) - +new Date(a.pushed_at));
    return out;
  }, [repos, query, lang, sort]);

  const total = (k: "stargazers_count" | "forks_count") => repos?.reduce((s, r) => s + r[k], 0);
  const stats: [string, number | undefined][] = [
    ["REPOS", repos?.length], ["STARS", total("stargazers_count")], ["FORKS", total("forks_count")], ["LANGUAGES", repos ? langs.length : undefined],
  ];

  async function hover(r: Repo) {
    setPreview({ repo: r });
    const img = await fetchReadmePreview(r);
    setPreview((p) => (p?.repo.id === r.id ? { repo: r, img } : p));
  }

  return (
    <div className="cx cx-archive">
      <div className="cx-archive-fx" aria-hidden="true" />
      <header className="cx-head">
        <Link href="/" className="cx-brand cx-dot-type">{config.person.name}</Link>
        <nav className="cx-head-right">
          <a href={`https://github.com/${GH_USER}`} target="_blank" rel="noreferrer">GITHUB ↗</a>
          <Link href="/">← BACK</Link>
        </nav>
      </header>

      <main className="cx-archive-main" ref={mainRef}>
        <h1 className="cx-dot-type" data-build>ARCHIVE</h1>
        <p className="cx-archive-meta" data-build>{error ? `⚠ ${error}` : repos ? "EVERY PUBLIC REPO · LIVE FROM GITHUB" : "SYNCING WITH GITHUB…"}</p>

        <section className="cx-archive-stats" aria-label="Totals">
          {stats.map(([k, v]) => (
            <div key={k} data-build><b className="cx-dot-type">{v ?? "—"}</b><span>{k}</span></div>
          ))}
        </section>

        {langs.length > 0 && (
          <div className="cx-archive-langbar" aria-hidden="true" data-build>
            {langs.map(([name, n]) => (
              <i key={name} title={`${name} · ${n}`} style={{ flex: n, background: LANG_COLORS[name] ?? "#888", opacity: !lang || lang === name ? 1 : 0.2 }} />
            ))}
          </div>
        )}

        <div className="cx-archive-controls" data-build>
          <label>
            <span>&gt;</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="GREP REPOS, TOPICS, LANGUAGES" aria-label="Search repositories" />
          </label>
          <div role="group" aria-label="Sort">
            {(["recent", "stars", "name"] as const).map((s) => (
              <button key={s} type="button" className={sort === s ? "is-active" : ""} onClick={() => setSort(s)} aria-pressed={sort === s}>
                {s === "recent" ? "RECENT" : s === "stars" ? "STARS" : "A→Z"}
              </button>
            ))}
          </div>
        </div>

        {langs.length > 0 && (
          <div className="cx-archive-chips" role="group" aria-label="Filter by language" data-build>
            <button type="button" className={!lang ? "is-active" : ""} onClick={() => setLang("")} aria-pressed={!lang}>ALL <em>{repos?.length}</em></button>
            {langs.map(([name, n]) => (
              <button key={name} type="button" className={lang === name ? "is-active" : ""} onClick={() => setLang(lang === name ? "" : name)} aria-pressed={lang === name}>
                <i style={{ background: LANG_COLORS[name] ?? "#888" }} />{name} <em>{n}</em>
              </button>
            ))}
          </div>
        )}

        <ol className="cx-archive-list" onPointerLeave={() => setPreview(null)}>
          {list.map((r, i) => (
            <li key={r.id} onPointerEnter={() => hover(r)} data-build>
              <span className="cx-a-idx">[{String(i + 1).padStart(2, "0")}]</span>
              <div className="cx-a-main">
                <a className="cx-a-name" href={r.html_url} target="_blank" rel="noreferrer" onFocus={() => hover(r)}>{r.name}</a>
                <span className="cx-a-desc">{r.description || "—"}</span>
                {(r.topics ?? []).filter((t) => t !== config.github.featuredTopic).length > 0 && (
                  <span className="cx-a-topics">
                    {(r.topics ?? []).filter((t) => t !== config.github.featuredTopic).slice(0, 5).map((t) => <i key={t}>{t}</i>)}
                  </span>
                )}
              </div>
              <span className="cx-a-lang"><i style={{ background: LANG_COLORS[r.language ?? ""] ?? "#888" }} />{r.language ?? "—"}</span>
              <span className="cx-a-num">★ {r.stargazers_count}</span>
              <span className="cx-a-num cx-a-forks">⑂ {r.forks_count}</span>
              <span className="cx-a-when">{timeAgo(r.pushed_at)}</span>
              {r.homepage ? <a className="cx-a-live" href={r.homepage} target="_blank" rel="noreferrer">LIVE ↗</a> : <span />}
            </li>
          ))}
          {repos && list.length === 0 && <li className="cx-archive-empty">NO MATCH{query ? ` FOR "${query}"` : ""}{lang ? ` IN ${lang}` : ""}</li>}
        </ol>
      </main>

      <div ref={previewRef} className={`cx-archive-preview${preview ? " is-on" : ""}`} aria-hidden="true">
        {preview && <Screen key={preview.repo.id} {...preview} />}
        {preview && <p>{preview.repo.name}</p>}
      </div>
    </div>
  );
}
