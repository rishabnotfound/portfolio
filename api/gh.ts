import type { VercelRequest, VercelResponse } from "@vercel/node";
import { proxyGithub } from "./_github";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url || "/", "http://x");
  const path = url.searchParams.get("path") || "";
  if (!path) {
    res.status(400).json({ error: "missing_path" });
    return;
  }
  url.searchParams.delete("path");
  const qs = url.searchParams.toString();

  try {
    const r = await proxyGithub(`${path}${qs ? "?" + qs : ""}`, req.headers["accept"] as string | undefined, process.env.GITHUB_TOKEN);
    res.status(r.status);
    res.setHeader("content-type", r.contentType);
    res.setHeader("cache-control", "public, s-maxage=300, stale-while-revalidate=600");
    res.send(r.body);
  } catch (err) {
    res.status(502).json({ error: "proxy_failed", detail: String(err) });
  }
}
