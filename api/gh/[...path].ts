export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const sub = url.pathname.replace(/^\/api\/gh\//, "");
  const upstream = `https://api.github.com/${sub}${url.search}`;

  const headers: Record<string, string> = {
    "Accept": req.headers.get("accept") || "application/vnd.github+json",
    "User-Agent": "rishab-portfolio-proxy",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(upstream, { headers });
    const body = await res.arrayBuffer();
    const outHeaders = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) outHeaders.set("content-type", ct);
    outHeaders.set("cache-control", "public, s-maxage=300, stale-while-revalidate=600");
    return new Response(body, { status: res.status, headers: outHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "proxy_failed", detail: String(err) }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
