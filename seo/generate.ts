import type { config as Config } from "../src/config";

type C = typeof Config;
type Entry = C["timeline"][number];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const today = () => new Date().toISOString().slice(0, 10);
const site = (c: C) => c.site.url.replace(/\/$/, "");
const abs = (c: C, path: string) => (path.startsWith("http") ? path : `${site(c)}${path}`);
const webLinks = (c: C) => c.socials.filter((s) => s.href.startsWith("http"));
const work = (c: C) => c.timeline.filter((t) => t.type === "work");
const edu = (c: C) => c.timeline.filter((t) => t.type === "education");
const currentWork = (c: C) => work(c).find((t) => t.current) ?? work(c).at(-1);
const born = (c: C) => new Date(`${c.person.born}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const orgId = (t: Entry) => `${t.url ?? "#" + t.org.replace(/\W+/g, "-").toLowerCase()}#org`;

function jsonLd(c: C) {
  const url = `${site(c)}/`;
  const cur = currentWork(c);
  const person = {
    "@type": "Person",
    "@id": `${url}#person`,
    name: c.person.name,
    givenName: c.person.givenName,
    familyName: c.person.familyName,
    alternateName: [c.person.handle, c.person.givenName],
    url,
    image: abs(c, c.site.favicon),
    gender: c.person.gender,
    birthDate: c.person.born,
    jobTitle: c.person.jobTitle,
    description: c.person.summary,
    email: `mailto:${c.person.email}`,
    address: { "@type": "PostalAddress", addressLocality: c.person.city, addressCountry: c.person.country },
    homeLocation: { "@type": "Place", name: c.person.location },
    nationality: { "@type": "Country", name: c.person.nationality },
    knowsLanguage: c.person.languages,
    knowsAbout: c.seo.knowsAbout,
    sameAs: webLinks(c).map((s) => s.href),
    ...(cur && { worksFor: { "@id": orgId(cur) } }),
    alumniOf: [...new Map(edu(c).map((t) => [t.org, { "@type": "EducationalOrganization", name: t.org, ...(t.url && { url: t.url }) }])).values()],
  };
  const orgs = work(c).filter((t) => t.current).map((t) => ({
    "@type": "Organization", "@id": orgId(t), name: t.org, ...(t.url && { url: t.url }), description: t.note,
    founder: { "@id": `${url}#person` }, ...(t.sameAs && { sameAs: t.sameAs }),
  }));
  const graph = [
    person,
    ...orgs,
    { "@type": "WebSite", "@id": `${url}#website`, url, name: `${c.person.name} — Portfolio`, publisher: { "@id": `${url}#person` }, inLanguage: "en" },
    {
      "@type": "ProfilePage", "@id": `${url}#webpage`, url, name: c.site.title, isPartOf: { "@id": `${url}#website` },
      mainEntity: { "@id": `${url}#person` }, primaryImageOfPage: abs(c, c.site.ogImage), dateModified: today(), inLanguage: "en",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url },
        { "@type": "ListItem", position: 2, name: "Projects", item: `${url}projects` },
      ],
    },
    ...(c.seo.faq.length ? [{
      "@type": "FAQPage",
      mainEntity: c.seo.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    }] : []),
  ];
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2).replace(/</g, "\\u003c");
}

export function headTags(c: C) {
  const url = `${site(c)}/`, img = abs(c, c.site.ogImage), t = esc(c.site.title), d = esc(c.site.description);
  const g = c.site.geo;
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}" />`,
    `<meta name="keywords" content="${esc(c.site.keywords.join(", "))}" />`,
    `<meta name="author" content="${esc(c.person.name)}" />`,
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`,
    `<meta name="theme-color" content="${c.site.themeColor}" />`,
    g && `<meta name="geo.region" content="${g.region}" />\n    <meta name="geo.placename" content="${esc(g.placename)}" />\n    <meta name="geo.position" content="${g.lat};${g.lng}" />\n    <meta name="ICBM" content="${g.lat}, ${g.lng}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:site_name" content="${esc(c.person.name)}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:title" content="${t}" />`,
    `<meta property="og:description" content="${d}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${img}" />`,
    `<meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${t}" />`,
    `<meta property="og:locale" content="${c.site.locale}" />`,
    `<meta property="profile:first_name" content="${esc(c.person.givenName)}" />\n    <meta property="profile:last_name" content="${esc(c.person.familyName)}" />\n    <meta property="profile:username" content="${esc(c.person.handle)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${t}" />`,
    `<meta name="twitter:description" content="${d}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    c.site.twitter && `<meta name="twitter:creator" content="${esc(c.site.twitter)}" />\n    <meta name="twitter:site" content="${esc(c.site.twitter)}" />`,
    `<link rel="icon" type="image/png" href="${c.site.favicon}" sizes="any" />\n    <link rel="apple-touch-icon" href="${c.site.favicon}" />`,
    `<link rel="sitemap" type="application/xml" href="/sitemap.xml" />\n    <link rel="alternate" type="text/plain" title="llms.txt" href="/llms.txt" />`,
    ...webLinks(c).map((s) => `<link rel="me" href="${esc(s.href)}" />`),
    `<script type="application/ld+json">\n${jsonLd(c)}\n    </script>`,
  ].filter(Boolean).join("\n    ");
}

export function crawlerFallback(c: C) {
  const p = c.person;
  const line = (t: Entry) => `<li><strong>${esc(t.org)}</strong> — ${esc(t.title)} (${esc(t.when)})${t.note ? `. ${esc(t.note)}` : ""}${t.url ? ` <a href="${esc(t.url)}">${esc(t.url)}</a>` : ""}</li>`;
  const projects = [
    ...c.projects.map((x) => ({ name: x.repo, url: `https://github.com/${c.accounts.github}/${x.repo}`, homepage: "homepage" in x ? (x as { homepage?: string }).homepage : undefined, desc: x.desc })),
    ...c.seo.extraProjects.map((x) => ({ ...x, homepage: undefined as string | undefined })),
  ];
  return `<div id="seo-content" style="position:absolute;left:-99999px;top:auto;width:1px;height:1px;overflow:hidden;" aria-hidden="true">
      <h1>${esc(p.name)} — ${esc(p.jobTitle)}${currentWork(c) ? ` at ${esc(currentWork(c)!.org)}` : ""}</h1>
      <p>${esc(p.name)} (<strong>${esc(p.handle)}</strong>), born <time datetime="${p.born}">${born(c)}</time>, ${esc(p.location)}. ${esc(p.summary)}</p>
      <h2>About ${esc(p.givenName)}</h2>
      <p>${esc(c.seo.about)}</p>
      <h2>Projects</h2>
      <ul>
        ${projects.map((x) => `<li><a href="${esc(x.homepage ?? x.url)}">${esc(x.name)}</a> — ${esc(x.desc)}${x.homepage ? ` <a href="${esc(x.url)}">Source</a>` : ""}</li>`).join("\n        ")}
      </ul>
      <h2>Areas of expertise</h2>
      <ul>
        ${c.seo.expertise.map((e) => `<li>${esc(e)}</li>`).join("\n        ")}
      </ul>
      ${c.seo.openSource.length ? `<h2>Open-source contributions</h2>
      <ul>
        ${c.seo.openSource.map((o) => `<li><a href="${esc(o.url)}">${esc(o.label)}</a> — ${esc(o.desc)}</li>`).join("\n        ")}
      </ul>` : ""}
      <h2>Experience &amp; education</h2>
      <ul>
        ${[...work(c), ...edu(c)].reverse().map(line).join("\n        ")}
      </ul>
      <h2>Contact ${esc(p.givenName)}</h2>
      <p>Email: <a href="mailto:${esc(p.email)}">${esc(p.email)}</a>. Handle <strong>@${esc(p.handle)}</strong>:
        ${webLinks(c).map((s) => `<a href="${esc(s.href)}">${esc(s.label)}</a>`).join(",\n        ")}.
      </p>
    </div>`;
}

export function llmsTxt(c: C) {
  const p = c.person, cur = currentWork(c);
  const item = (t: Entry) => `- **${t.title} — ${t.org}** (${t.when})${t.note ? `: ${t.note}` : ""}${t.url ? ` — ${t.url}` : ""}`;
  return `# ${p.name}

> ${p.name} (handle: @${p.handle}) — ${p.jobTitle}${cur ? ` at ${cur.org}` : ""}. ${p.summary}

This file follows the llms.txt convention (https://llmstxt.org/) so LLMs and AI crawlers can learn who ${p.givenName} is without scraping rendered pages.

## Identity

- Full name: ${p.name}
- Handle: \`@${p.handle}\`
- Date of birth: ${p.born}
- Location: ${p.location}
- Nationality: ${p.nationality}
- Languages: ${p.languages.join(", ")}
- Website: ${site(c)}
- Email: ${p.email}

## Work

${[...work(c)].reverse().map(item).join("\n")}

## Education

${[...edu(c)].reverse().map(item).join("\n")}

## Projects

${c.projects.map((x) => `- **${x.repo}** — ${x.desc} (https://github.com/${c.accounts.github}/${x.repo})`).join("\n")}
${c.seo.extraProjects.map((x) => `- **${x.name}** — ${x.desc} (${x.url})`).join("\n")}

## Open-source contributions

${c.seo.openSource.map((o) => `- [${o.label}](${o.url}): ${o.desc}`).join("\n")}

## Skills

${c.seo.expertise.map((e) => `- ${e}`).join("\n")}

## Links

${c.socials.map((s) => `- ${s.label}: ${s.href.replace(/^mailto:/, "")}`).join("\n")}
`;
}

export function sitemapXml(c: C) {
  const d = today();
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${site(c)}/</loc>
    <lastmod>${d}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${abs(c, c.site.ogImage)}</image:loc>
      <image:title>${esc(c.site.title)}</image:title>
    </image:image>
  </url>
  <url>
    <loc>${site(c)}/projects</loc>
    <lastmod>${d}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`;
}

export function robotsTxt(c: C) {
  const bots = ["Googlebot", "Bingbot", "DuckDuckBot", "GPTBot", "OAI-SearchBot", "PerplexityBot", "ClaudeBot"];
  return `User-agent: *
Allow: /
Disallow: /api/

${bots.map((b) => `User-agent: ${b}\nAllow: /`).join("\n\n")}

Sitemap: ${site(c)}/sitemap.xml

# LLM-friendly summary (llms.txt convention — https://llmstxt.org/)
# ${site(c)}/llms.txt
`;
}
