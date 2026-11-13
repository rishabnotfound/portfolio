import { useSyncExternalStore } from "react";
import { GH_USER, type Repo } from "../lib/github";
import { DISCORD_ID, PROJECTS, OVERRIDES, type Project } from "./data";
import { config } from "../config";

const TOPIC = config.github.featuredTopic;

export type Presence = {
  status: "online" | "idle" | "dnd" | "offline";
  activity?: string;
  spotify?: { song: string; artist: string; start: number; end: number; art?: string };
};
export type Activity = { type: number; name: string; details?: string; state?: string; large?: string; small?: string; start?: number; end?: number };
export type Discord = {
  id: string; username: string; name: string; avatar?: string; decoration?: string; color?: number;
  tag?: { text: string; badge: string };
  platforms: string[];
  custom?: string;
  activities: Activity[];
};
export type GhUser = { login: string; name?: string; bio?: string; avatar: string; followers: number; following: number; created: string };
export type Leet = {
  ranking: number; totalSolved: number; easySolved: number; mediumSolved: number; hardSolved: number;
  totalQuestions: number; totalEasy: number; totalMedium: number; totalHard: number;
};
export type Commit = { repo: string; msg: string; date: string; url: string };
export type PR = { repo: string; number: number; title: string; date: string; url: string };
export type Day = { date: string; count: number; level: number };

export type Live = {
  presence?: Presence;
  discord?: Discord;
  gh?: GhUser;
  leet?: Leet;
  langs?: { name: string; count: number }[];
  repos?: number; stars?: number; followers?: number; solved?: number;
  commits?: Commit[];
  prs?: PR[];
  days?: Day[];
  contribTotal?: number;
  updated?: number;
};

let state: Live = {};
const subs = new Set<() => void>();
const set = (x: Partial<Live>) => { state = { ...state, ...x, updated: Date.now() }; subs.forEach((f) => f()); };
export const getLive = () => state;
export const subscribe = (f: () => void) => (subs.add(f), () => subs.delete(f));
export const useLive = () => useSyncExternalStore(subscribe, getLive);

const gh = (path: string) => fetch(`/api/gh/${path}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
const q = (s: string) => encodeURIComponent(s);

export function toProject(r: Repo): Project {
  const o = OVERRIDES[r.name.toLowerCase()];
  return {
    id: r.name.toLowerCase(),
    name: r.name.toUpperCase(),
    tag: o?.tag ?? (r.topics?.filter((t) => t !== TOPIC).slice(0, 2).join(" · ").toUpperCase() || `${r.language ?? "CODE"} PROJECT`),
    stack: o?.stack ?? [r.language, ...(r.topics ?? []).filter((t) => t !== TOPIC).slice(2, 4)].filter(Boolean).join(" · ").toUpperCase(),
    desc: o?.desc ?? r.description ?? "No description yet.",
    url: r.html_url,
    lang: r.language ?? undefined,
    stars: r.stargazers_count,
  };
}

export async function loadFeatured(timeoutMs = 2500): Promise<Project[]> {
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), timeoutMs));
  const req = gh(`search/repositories?q=${q(`user:${GH_USER} topic:${TOPIC} is:public`)}&sort=stars&per_page=8`)
    .then((d: { items?: Repo[] }) => (d.items?.length ? d.items.map(toProject) : null))
    .catch(() => null);
  return (await Promise.race([req, timeout])) ?? PROJECTS;
}

function streaks(days: Day[]) {
  let longest = 0, run = 0;
  days.forEach((d) => { run = d.count ? run + 1 : 0; longest = Math.max(longest, run); });
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count) current++;
    else if (i !== days.length - 1) break;
  }
  return { current, longest };
}
export const contribStats = (days: Day[]) => {
  const busiest = days.reduce((m, d) => (d.count > m.count ? d : m), days[0]);
  return { busiest, ...streaks(days) };
};

let started = false;
export function startLive() {
  if (started) return;
  started = true;

  gh(`users/${GH_USER}`).then((u) => set({
    followers: u.followers,
    gh: { login: u.login, name: u.name ?? undefined, bio: u.bio ?? undefined, avatar: u.avatar_url, followers: u.followers, following: u.following, created: u.created_at },
  })).catch(() => {});
  gh(`users/${GH_USER}/repos?per_page=100`).then((rs: Repo[]) => {
    const own = rs.filter((r) => !r.fork && !r.private);
    const tally = new Map<string, number>();
    own.forEach((r) => r.language && tally.set(r.language, (tally.get(r.language) ?? 0) + 1));
    set({
      repos: own.length, stars: own.reduce((a, r) => a + r.stargazers_count, 0),
      langs: [...tally].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    });
  }).catch(() => {});
  fetch(`/api/leetcode?username=${config.accounts.leetcode}`).then((r) => r.json())
    .then((j) => typeof j?.totalSolved === "number" && set({ solved: j.totalSolved, leet: j })).catch(() => {});

  gh(`search/issues?q=${q(`is:pr author:${GH_USER} is:merged ${[GH_USER, ...config.github.excludeUpstreamOwners].map((o) => `-user:${o}`).join(" ")} is:public`)}&sort=created&order=desc&per_page=30`)
    .then((d: { items: { repository_url: string; number: number; title: string; closed_at: string; html_url: string }[] }) =>
      set({ prs: d.items.map((i) => ({ repo: i.repository_url.split("/repos/")[1], number: i.number, title: i.title, date: i.closed_at, url: i.html_url })) }))
    .catch(() => {});

  gh(`search/commits?q=${q(`author:${GH_USER} is:public`)}&sort=author-date&order=desc&per_page=50`)
    .then((d: { items: { repository: { full_name: string }; commit: { message: string; author: { date: string } }; html_url: string }[] }) =>
      set({
        commits: d.items
          .map((i) => ({ repo: i.repository.full_name, msg: i.commit.message.split("\n")[0], date: i.commit.author.date, url: i.html_url }))
          .filter((c) => !new RegExp(config.github.ignoreCommits, "i").test(c.msg))
          .slice(0, 12),
      }))
    .catch(() => {});

  fetch(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`).then((r) => r.json())
    .then((j: { total: Record<string, number>; contributions: Day[] }) =>
      set({ days: j.contributions.slice(-371), contribTotal: Object.values(j.total)[0] }))
    .catch(() => {});

  const presence = () =>
    fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`).then((r) => r.json()).then((j) => {
      if (!j?.success) return;
      const d = j.data;
      const u = d.discord_user;
      const acts: LanyardActivity[] = d.activities || [];
      const playing = acts.filter((a) => a.type !== 4 && a.name !== "Spotify");
      const custom = acts.find((a) => a.type === 4);
      set({
        presence: {
          status: d.discord_status,
          activity: playing[0]?.name,
          spotify: d.spotify ? { song: d.spotify.song, artist: d.spotify.artist, start: d.spotify.timestamps.start, end: d.spotify.timestamps.end, art: d.spotify.album_art_url } : undefined,
        },
        discord: {
          id: u.id, username: u.username, name: u.global_name || u.username,
          avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256` : undefined,
          decoration: u.avatar_decoration_data ? `https://cdn.discordapp.com/avatar-decoration-presets/${u.avatar_decoration_data.asset}.png?size=256&passthrough=false` : undefined,
          color: u.display_name_styles?.colors?.[0],
          tag: u.primary_guild?.tag ? { text: u.primary_guild.tag, badge: `https://cdn.discordapp.com/guild-tag-badges/${u.primary_guild.identity_guild_id}/${u.primary_guild.badge}.png?size=64` } : undefined,
          platforms: ["desktop", "web", "mobile"].filter((k) => d[`active_on_discord_${k}`]),
          custom: custom ? [custom.emoji?.name, custom.state].filter(Boolean).join(" ") : undefined,
          activities: playing.map((act) => ({
            type: act.type, name: act.name, details: act.details, state: act.state, start: act.timestamps?.start, end: act.timestamps?.end,
            large: asset(act.assets?.large_image, act.application_id),
            small: asset(act.assets?.small_image, act.application_id),
          })),
        },
      });
    }).catch(() => {});
  if (!DISCORD_ID) return;
  presence();
  setInterval(presence, 30000);
}

type LanyardActivity = {
  type: number; name: string; details?: string; state?: string; application_id?: string;
  timestamps?: { start?: number; end?: number }; assets?: { large_image?: string; small_image?: string }; emoji?: { name?: string };
};

function asset(a: string | undefined, app?: string) {
  if (!a) return undefined;
  if (a.startsWith("mp:")) return `https://media.discordapp.net/${a.slice(3)}`;
  if (a.startsWith("spotify:")) return `https://i.scdn.co/image/${a.slice(8)}`;
  return app ? `https://cdn.discordapp.com/app-assets/${app}/${a}.png` : undefined;
}

export function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}M AGO`;
  if (s < 86400) return `${Math.round(s / 3600)}H AGO`;
  if (s < 86400 * 30) return `${Math.round(s / 86400)}D AGO`;
  if (s < 86400 * 365) return `${Math.round(s / 86400 / 30)}MO AGO`;
  return `${Math.round(s / 86400 / 365)}Y AGO`;
}
