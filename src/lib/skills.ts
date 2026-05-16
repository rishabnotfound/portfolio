export type Skill = { name: string; icon: string; category: SkillCategory };

export type SkillCategory =
  | "Languages"
  | "Frontend"
  | "Styling"
  | "Backend"
  | "Databases"
  | "Cloud"
  | "DevOps"
  | "Tooling";

const dev = (slug: string, variant = "original") =>
  `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-${variant}.svg`;
const si = (slug: string) => `https://cdn.simpleicons.org/${slug}`;

export const SKILLS: Skill[] = [
  { category: "Languages", name: "JavaScript", icon: dev("javascript") },
  { category: "Languages", name: "TypeScript", icon: dev("typescript") },
  { category: "Languages", name: "Python", icon: dev("python") },
  { category: "Languages", name: "Go", icon: dev("go") },
  { category: "Languages", name: "PHP", icon: dev("php") },
  { category: "Languages", name: "Lua", icon: dev("lua") },
  { category: "Languages", name: "YAML", icon: dev("yaml") },

  { category: "Frontend", name: "React", icon: dev("react") },
  { category: "Frontend", name: "Next.js", icon: dev("nextjs") },
  { category: "Frontend", name: "Vue.js", icon: dev("vuejs") },
  { category: "Frontend", name: "Nuxt.js", icon: dev("nuxtjs") },
  { category: "Frontend", name: "Three.js", icon: dev("threejs") },
  { category: "Frontend", name: "Framer", icon: dev("framermotion") },
  { category: "Frontend", name: "jQuery", icon: dev("jquery") },
  { category: "Frontend", name: "Vite", icon: dev("vitejs") },

  { category: "Styling", name: "HTML5", icon: dev("html5") },
  { category: "Styling", name: "CSS3", icon: dev("css3") },
  { category: "Styling", name: "Tailwind", icon: dev("tailwindcss") },
  { category: "Styling", name: "SASS", icon: dev("sass") },
  { category: "Styling", name: "PostCSS", icon: dev("postcss") },

  { category: "Backend", name: "Node.js", icon: dev("nodejs") },
  { category: "Backend", name: "Express", icon: dev("express") },
  { category: "Backend", name: "Socket.io", icon: dev("socketio") },
  { category: "Backend", name: "Nginx", icon: dev("nginx") },
  { category: "Backend", name: "FastAPI", icon: dev("fastapi") },
  { category: "Backend", name: "JWT", icon: si("jsonwebtokens") },

  { category: "Databases", name: "MongoDB", icon: dev("mongodb") },
  { category: "Databases", name: "MySQL", icon: dev("mysql") },
  { category: "Databases", name: "Prisma", icon: dev("prisma") },
  { category: "Databases", name: "Firebase", icon: dev("firebase", "plain") },

  { category: "Cloud", name: "Google Cloud", icon: dev("googlecloud") },
  { category: "Cloud", name: "Vercel", icon: dev("vercel") },
  { category: "Cloud", name: "Cloudflare", icon: dev("cloudflare") },
  { category: "Cloud", name: "Netlify", icon: dev("netlify") },
  { category: "Cloud", name: "Ubuntu VPS", icon: si("ubuntu") },
  { category: "Cloud", name: "CodePen", icon: si("codepen") },
  { category: "Cloud", name: "Replit", icon: dev("replit") },
  { category: "Cloud", name: "Glitch", icon: si("glitch/3333FF/white") },

  { category: "DevOps", name: "Docker", icon: dev("docker") },
  { category: "DevOps", name: "Git", icon: dev("git") },
  { category: "DevOps", name: "npm", icon: dev("npm", "original-wordmark") },
  { category: "DevOps", name: "pnpm", icon: dev("pnpm") },
  { category: "DevOps", name: "GitHub", icon: dev("github") },
  { category: "DevOps", name: "GitHub Actions", icon: dev("githubactions") },
  { category: "DevOps", name: "VS Code", icon: dev("vscode") },
  { category: "DevOps", name: "PyCharm", icon: dev("pycharm") },
  { category: "DevOps", name: "Linux", icon: dev("linux") },
  { category: "DevOps", name: "Windows", icon: dev("windows11") },
  { category: "DevOps", name: "Librewolf", icon: si("librewolf") },

  { category: "Tooling", name: "ESLint", icon: dev("eslint") },
  { category: "Tooling", name: "FFmpeg", icon: si("ffmpeg/007808/white") },
  { category: "Tooling", name: "WebGL", icon: si("webgl/990000/white") },
  { category: "Tooling", name: "Puppeteer", icon: si("puppeteer") },
  { category: "Tooling", name: "Selenium", icon: dev("selenium") },
  { category: "Tooling", name: "Cheerio", icon: si("cheerio") },
  { category: "Tooling", name: "Axios", icon: si("axios") },
  { category: "Tooling", name: "DiscordJS", icon: si("discorddotjs") },
  { category: "Tooling", name: "Wireshark", icon: si("wireshark") },
  { category: "Tooling", name: "Postman", icon: si("postman") },
];

export const CATEGORIES: SkillCategory[] = [
  "Languages",
  "Frontend",
  "Styling",
  "Backend",
  "Databases",
  "Cloud",
  "DevOps",
  "Tooling",
];
