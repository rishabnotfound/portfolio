import { defineConfig, loadEnv, type Connect, type Plugin, type ViteDevServer, type PreviewServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { proxyGithub } from "./api/_github";
import { config as portfolio } from "./src/config";
import { headTags, crawlerFallback, llmsTxt, sitemapXml, robotsTxt } from "./seo/generate";

const env = loadEnv("development", process.cwd(), "");
const port = Number(process.env.PORT ?? 5173);
const basePath = process.env.BASE_PATH ?? "/";
const githubToken = env.GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";

function githubProxyPlugin(): Plugin {
  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/gh/")) return next();
    try {
      const r = await proxyGithub(req.url.slice("/api/gh/".length), req.headers["accept"]?.toString(), githubToken);
      res.statusCode = r.status;
      res.setHeader("Content-Type", r.contentType);
      res.setHeader("Cache-Control", "public, max-age=300");
      res.end(r.body);
    } catch (err) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "proxy_failed", detail: String(err) }));
    }
  };
  return {
    name: "github-proxy",
    configureServer(server: ViteDevServer) { server.middlewares.use(handler); },
    configurePreviewServer(server: PreviewServer) { server.middlewares.use(handler); },
  };
}

function seoPlugin(): Plugin {
  const files: Record<string, [string, () => string]> = {
    "/llms.txt": ["text/plain; charset=utf-8", () => llmsTxt(portfolio)],
    "/sitemap.xml": ["application/xml; charset=utf-8", () => sitemapXml(portfolio)],
    "/robots.txt": ["text/plain; charset=utf-8", () => robotsTxt(portfolio)],
  };
  const serve: Connect.NextHandleFunction = (req, res, next) => {
    const f = files[req.url?.split("?")[0] ?? ""];
    if (!f) return next();
    res.setHeader("Content-Type", f[0]);
    res.end(f[1]());
  };
  return {
    name: "portfolio-seo",
    transformIndexHtml: (html) => html.replace("<!--seo:head-->", headTags(portfolio)).replace("<!--seo:body-->", crawlerFallback(portfolio)),
    configureServer(server: ViteDevServer) { server.middlewares.use(serve); },
    configurePreviewServer(server: PreviewServer) { server.middlewares.use(serve); },
    generateBundle() {
      for (const [path, [, make]] of Object.entries(files)) this.emitFile({ type: "asset", fileName: path.slice(1), source: make() });
    },
  };
}

function leetcodeProxyPlugin(): Plugin {
  const QUERY = `
    query userStats($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking }
        submitStatsGlobal { acSubmissionNum { difficulty count } }
      }
      allQuestionsCount { difficulty count }
    }
  `;

  const bucket = (arr: { difficulty: string; count: number }[], k: string) =>
    arr.find((b) => b.difficulty === k)?.count ?? 0;

  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url || !req.url.startsWith("/api/leetcode")) return next();
    const url = new URL(req.url, "http://x");
    const username = (url.searchParams.get("username") || "").trim();
    if (!username) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "missing_username" }));
      return;
    }
    try {
      const upstreamRes = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
          "Referer": `https://leetcode.com/u/${username}`,
        },
        body: JSON.stringify({ query: QUERY, variables: { username } }),
      });
      if (!upstreamRes.ok) {
        res.statusCode = upstreamRes.status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "upstream_error" }));
        return;
      }
      const j: any = await upstreamRes.json();
      if (j.errors?.length || !j.data?.matchedUser) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "user_not_found" }));
        return;
      }
      const u = j.data.matchedUser;
      const solved = u.submitStatsGlobal.acSubmissionNum;
      const all = j.data.allQuestionsCount;
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.end(JSON.stringify({
        username: u.username,
        ranking: u.profile.ranking,
        totalSolved: bucket(solved, "All"),
        easySolved: bucket(solved, "Easy"),
        mediumSolved: bucket(solved, "Medium"),
        hardSolved: bucket(solved, "Hard"),
        totalQuestions: bucket(all, "All"),
        totalEasy: bucket(all, "Easy"),
        totalMedium: bucket(all, "Medium"),
        totalHard: bucket(all, "Hard"),
      }));
    } catch (err) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: "proxy_failed", detail: String(err) }));
    }
  };
  return {
    name: "leetcode-proxy",
    configureServer(server: ViteDevServer) { server.middlewares.use(handler); },
    configurePreviewServer(server: PreviewServer) { server.middlewares.use(handler); },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    githubProxyPlugin(),
    seoPlugin(),
    leetcodeProxyPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
