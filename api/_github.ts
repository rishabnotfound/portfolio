import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync(new URL("../portfolio.config.json", import.meta.url), "utf8")) as { accounts: { github: string } };
const OWNER = config.accounts.github;

type Result = { status: number; contentType: string; body: Buffer };

const json = (status: number, data: unknown): Result => ({
  status, contentType: "application/json", body: Buffer.from(JSON.stringify(data)),
});

export async function proxyGithub(pathAndQuery: string, accept: string | undefined, token?: string): Promise<Result> {
  const url = new URL(pathAndQuery.replace(/^\/+/, ""), "https://api.github.com/");
  const path = url.pathname.replace(/^\/+/, "");
  const headers: Record<string, string> = {
    Accept: accept === "application/vnd.github.raw" ? accept : "application/vnd.github+json",
    "User-Agent": "portfolio-proxy",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const get = async (u: URL | string, h = headers): Promise<Result> => {
    const r = await fetch(u, { headers: h });
    return { status: r.status, contentType: r.headers.get("content-type") || "application/json", body: Buffer.from(await r.arrayBuffer()) };
  };

  if (path === `users/${OWNER}` || path === `users/${OWNER}/repos`) return get(url);

  if (path === `users/${OWNER}/languages`) {
    const list = await get(`https://api.github.com/users/${OWNER}/repos?per_page=100&type=owner`);
    if (list.status !== 200) return list;
    const repos = (JSON.parse(list.body.toString()) as { name: string; fork: boolean; private: boolean }[]).filter((r) => !r.fork && !r.private);
    const per = await Promise.all(repos.map(async (r) => {
      const res = await get(`https://api.github.com/repos/${OWNER}/${r.name}/languages`);
      return { repo: r.name, langs: res.status === 200 ? (JSON.parse(res.body.toString()) as Record<string, number>) : {} };
    }));
    const totals = new Map<string, { bytes: number; repos: { name: string; bytes: number }[] }>();
    for (const { repo, langs } of per) for (const [name, bytes] of Object.entries(langs)) {
      const t = totals.get(name) ?? { bytes: 0, repos: [] };
      t.bytes += bytes;
      t.repos.push({ name: repo, bytes });
      totals.set(name, t);
    }
    const languages = [...totals].map(([name, t]) => ({ name, bytes: t.bytes, repos: t.repos.sort((a, b) => b.bytes - a.bytes).map((r) => r.name) }))
      .sort((a, b) => b.bytes - a.bytes);
    return json(200, { languages, repos: repos.length });
  }

  if (/^search\/(repositories|issues|commits)$/.test(path)) {
    url.searchParams.set("q", `${url.searchParams.get("q") ?? ""} is:public`.trim());
    return get(url);
  }

  const readme = path.match(new RegExp(`^repos/${OWNER}/([\\w.-]+)/readme$`));
  if (readme) {
    const meta = await get(`https://api.github.com/repos/${OWNER}/${readme[1]}`, { ...headers, Accept: "application/vnd.github+json" });
    if (meta.status !== 200 || JSON.parse(meta.body.toString()).private !== false) return json(404, { error: "not_found" });
    return get(url);
  }

  return json(404, { error: "not_found" });
}
