import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const rawPath = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : String(req.query.path || "");

  const search = req.url && req.url.includes("?") ? "?" + req.url.split("?")[1] : "";
  const upstream = `https://api.github.com/${rawPath}${search}`;

  const headers: Record<string, string> = {
    Accept: (req.headers["accept"] as string) || "application/vnd.github+json",
    "User-Agent": "rishab-portfolio-proxy",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const upstreamRes = await fetch(upstream, { headers });
    const ct = upstreamRes.headers.get("content-type") || "application/json";
    const body = await upstreamRes.arrayBuffer();
    res.status(upstreamRes.status);
    res.setHeader("content-type", ct);
    res.setHeader("cache-control", "public, s-maxage=300, stale-while-revalidate=600");
    res.send(Buffer.from(body));
  } catch (err) {
    res.status(502).json({ error: "proxy_failed", detail: String(err) });
  }
}
