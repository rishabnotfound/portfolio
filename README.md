# Rishab — Portfolio

Cinematic, scroll-driven 3D portfolio built with Vite, React and three.js. Live at [rishab.cv](https://www.rishab.cv).

<img width="1467" height="841" alt="Screenshot 2026-11-13 at 5 34 37 AM" src="https://github.com/user-attachments/assets/1a94abfe-7057-483b-824c-15845b1d0dd9" />

## Make it yours

Fork it, then edit **one file**: [`portfolio.config.json`](./portfolio.config.json). Everything personal lives there — the site, the
serverless functions and all SEO output (meta tags, JSON-LD, crawler text, `llms.txt`, `sitemap.xml`, `robots.txt`) are generated from it.

| Key | What it drives |
|---|---|
| `site` | Domain, page title, meta description, keywords, OG image, theme colour, geo tags |
| `person` | Name, handle, pronouns, birthday (terminal `uptime`), location, email, avatar used for the voxel hero |
| `accounts` | GitHub / LeetCode usernames and Discord user ID — every live feed reads these |
| `github` | `featuredTopic` (tag repos with it to put them in the work reel), owners to exclude from "merged upstream", commit messages to hide |
| `hero` | The tag line and blurb on the first screen |
| `projects` | Curated work reel (used until a repo has the featured topic) and copy overrides for those repos |
| `terminal` | About-section lines. Tokens `{uptime}` `{repos}` `{stars}` `{followers}` `{solved}` are filled live |
| `timeline` | Journey entries (`type: work \| education`, `current: true` for present roles) — also feeds JSON-LD |
| `signal` | Which live cards to show (`discord`, `leetcode`, `github`, `linkedin`) and the fallback Discord banner |
| `linkedin` | The LinkedIn card (LinkedIn has no public API, so this is static) |
| `contact`, `socials` | Contact headline and every social link |
| `seo` | Long-form about text, expertise list, `knowsAbout`, open-source list, FAQ |

Then swap the images in `public/`: `profile.svg` (hero avatar), `nobg.png` (favicon), `opengraph.jpg` (1200×630 link preview),
`banner.png` (Discord banner fallback) and `logos/` (timeline icons).

The five hand-drawn screens in the work reel (`src/cinema/screens.ts`) are tied to the original repo names; any other repo gets a
generated screen from its name, description, language, stars and topics.

## Run

```bash
npm install
echo "GITHUB_TOKEN=ghp_xxx" > .env        # classic token with NO scopes — only lifts the rate limit
npm run dev
```

Set the same variables wherever you host it.

## Live data

| Source | Used for |
|---|---|
| GitHub API (via `api/gh`) | Repos, stars, followers, languages, featured repos, latest commits, merged upstream PRs |
| github-contributions-api | Contribution skyline, streaks, weekly counts |
| LeetCode GraphQL (via `api/leetcode`) | Solved counts and rank |
| Lanyard | Discord status, activity, Spotify, avatar, decoration, server tag |

`api/gh` only proxies the handful of endpoints the site needs and forces `is:public` on searches, so the token can't leak private data.

## Structure

```
portfolio.config.json   # ← edit this
src/cinema/             # the 3D site: engine, post-processing, scenes, cards, overlays
src/pages/Projects.tsx  # /projects — full GitHub archive with README previews
seo/generate.ts         # builds head tags, JSON-LD, crawler text, llms.txt, sitemap, robots from the config
api/                    # serverless functions: GitHub proxy, LeetCode, Discord banner
vite.config.ts          # dev versions of the api routes + the SEO plugin
```

## Scripts

- `npm run dev` — dev server with the API routes
- `npm run build` — production build to `dist/public`
- `npm run serve` — preview the build
- `npm run typecheck`
