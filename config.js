export const bot_token = process.env.DISCORD_BOT_TOKEN;
export const name = `Rishab`;
export const navbar_title = `<Rishab />`
export const github_username = `rishabnotfound`;
export const linkedin_username = `rishabnotfound`;
export const instagram_username = `rishabnotfound`;
export const leetcode_username = `rishabnotfound`;
export const contact_mail = `contact@rishab.cv`;
export const discord_userid = `1141729666160402565`;
export const discord_pronouns = `cos/sin`;
export const discord_bio = `Am i Perspiring?`;

//Check badges.ts for config of discord profile badges
export { discordBadges, getEnabledBadges } from './config/badges';

// OpenSource Contributions
export const openSourceContributions = [
  {
    id: 1,
    repoName: 'Node.js',
    repoUrl: 'https://github.com/rishabnotfound/node',
    pullRequestUrl: 'https://github.com/nodejs/node/pull/60235',
    pullRequestNumber: 60235,
    description: 'Contributed to Node.js, Removed unreachable conditionals in kFinishClose',
    logo: 'https://nodejs.org/static/logos/nodejsStackedDark.svg',
    logoAlt: 'Node.js Logo'
  },
  {
    id: 2,
    repoName: 'PreMiD Activities',
    repoUrl: 'https://github.com/rishabnotfound/Activities',
    pullRequestUrl: 'https://github.com/PreMiD/Activities/pull/9391',
    pullRequestNumber: 9391,
    description: 'Added new presence integration for PreMiD, enhancing the Discord Rich Presence experience for users.',
    logo: 'https://avatars.githubusercontent.com/u/46326568?s=200&v=4',
    logoAlt: 'PreMiD Logo'
  },
  {
    id: 3,
    repoName: 'FMHY Edit',
    repoUrl: 'https://github.com/rishabnotfound/edit',
    pullRequestUrl: 'https://github.com/fmhy/edit/pull/4094',
    pullRequestNumber: 4094,
    description: 'Contributed to the FreeMediaHeckYeah community project, added PWA Support.',
    logo: 'https://fmhy.net/test.png',
    logoAlt: 'FMHY Logo'
  }
];