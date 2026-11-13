import raw from "../portfolio.config.json";

export type TimelineEntry = {
  type: "work" | "education"; when: string; title: string; org: string;
  note?: string; logo?: string; url?: string; current?: boolean; sameAs?: string[];
};
export type SignalCard = "discord" | "leetcode" | "github" | "linkedin";

export const config = raw as Omit<typeof raw, "timeline" | "signal" | "terminal" | "contact"> & {
  contact: { headline: string; sub: string; form?: string };
  timeline: TimelineEntry[];
  signal: { cards: SignalCard[]; discordBanner?: string };
  terminal: { title: string; lines: [string, string][] };
};
