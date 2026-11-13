import { config } from "../config";

export const GH = `https://github.com/${config.accounts.github}`;

export type Project = {
  id: string; name: string; tag: string; desc: string; url: string; stack: string;
  lang?: string; stars?: number;
};

export const OVERRIDES: Record<string, Pick<Project, "tag" | "stack" | "desc">> = Object.fromEntries(
  config.projects.map((p) => [p.repo.toLowerCase(), { tag: p.tag.toUpperCase(), stack: p.stack.toUpperCase(), desc: p.desc }]),
);

export const PROJECTS: Project[] = config.projects.map((p) => ({
  id: p.repo.toLowerCase(), name: p.repo.toUpperCase(), url: `${GH}/${p.repo}`, ...OVERRIDES[p.repo.toLowerCase()],
}));

export const SOCIALS = config.socials.map((s) => ({ label: s.label.toUpperCase(), href: s.href }));
export const DISCORD_ID = config.accounts.discordId;
export const BORN = config.person.born;
export const TIMELINE = config.timeline;
export const LINKEDIN = { ...config.linkedin, name: config.person.name, pronouns: config.person.pronouns, location: config.person.location.split(",")[0] };
