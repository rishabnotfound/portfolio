// Discord Badge Configuration
// Configure which badges to display on your Discord profile card

export interface BadgeConfig {
  enabled: boolean;
  index: number; // Lower numbers appear first (0, 1, 2, etc.)
  iconUrl: string;
  name: string;
  tooltip?: string;
}

export interface BadgesConfig {
  [key: string]: BadgeConfig;
}

// Default badge configuration
// Set enabled: true to show the badge, false to hide it
// Set index to control the order (lower numbers appear first)
// Set iconUrl to the Discord CDN URL for the badge icon
export const discordBadges: BadgesConfig = {
  nitro: {
    enabled: true,
    index: 0,
    iconUrl: 'https://cdn.discordapp.com/badge-icons/2895086c18d5531d499862e41d1155a6.png',
    name: 'Nitro',
    tooltip: 'Discord Nitro Subscriber',
  },

  hypesquad: {
    enabled: true,
    index: 1,
    iconUrl: 'https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png',
    name: 'HypeSquad',
    tooltip: 'HypeSquad Balance',
  },

  activeDev: {
    enabled: false,
    index: 2,
    iconUrl: 'https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png',
    name: 'Active Developer',
    tooltip: 'Active Developer',
  },

  boostLvl: {
    enabled: true,
    index: 3,
    iconUrl: 'https://cdn.discordapp.com/badge-icons/72bed924410c304dbe3d00a6e593ff59.png',
    name: 'Server Boost',
    tooltip: 'Server Booster',
  },

  quest: {
    enabled: true,
    index: 4,
    iconUrl: 'https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png',
    name: 'Quest',
    tooltip: 'Quest Completed',
  },

  orbs: {
    enabled: true,
    index: 5,
    iconUrl: 'https://cdn.discordapp.com/badge-icons/83d8a1eb09a8d64e59233eec5d4d5c2d.png',
    name: 'Orbs',
    tooltip: 'Orbs',
  },

  // Example of how to add a custom badge:
  // customBadge: {
  //   enabled: true,
  //   index: 6,
  //   iconUrl: 'https://cdn.discordapp.com/badge-icons/YOUR_BADGE_ID.png',
  //   name: 'Custom Badge',
  //   tooltip: 'My Custom Badge',
  // },
};

// Helper function to get enabled badges sorted by index
export function getEnabledBadges(): BadgeConfig[] {
  return Object.values(discordBadges)
    .filter(badge => badge.enabled)
    .sort((a, b) => a.index - b.index);
}

// Badge URLs for different Nitro levels
export const NITRO_BADGE_URLS = {
  nitro: 'https://cdn.discordapp.com/badge-icons/2895086c18d5531d499862e41d1155a6.png',
  nitroClassic: 'https://cdn.discordapp.com/badge-icons/386884eecd36164487505ddfbcb9d1a6.png',
};

// Badge URLs for different HypeSquad houses
export const HYPESQUAD_BADGE_URLS = {
  bravery: 'https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png',
  brilliance: 'https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png',
  balance: 'https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png',
  events: 'https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png',
};

// Badge URLs for different Server Boost levels
export const BOOST_BADGE_URLS = {
  month1: 'https://cdn.discordapp.com/badge-icons/51040c70d4f20a921ad6674ff86fc95c.png',
  month2: 'https://cdn.discordapp.com/badge-icons/0e4080d1d333bc7ad29ef6528b6f2fb7.png',
  month3: 'https://cdn.discordapp.com/badge-icons/72bed924410c304dbe3d00a6e593ff59.png',
  month6: 'https://cdn.discordapp.com/badge-icons/df199d2050d3ed4ebf84d64ae83989f8.png',
  month9: 'https://cdn.discordapp.com/badge-icons/991c9f39ee33d7537d9f408c3e53141e.png',
  month12: 'https://cdn.discordapp.com/badge-icons/991c9f39ee33d7537d9f408c3e53141e.png',
  month15: 'https://cdn.discordapp.com/badge-icons/0011b68fd69aab8b49c806877e0c06d2.png',
  month18: 'https://cdn.discordapp.com/badge-icons/7142225d31238f6387d9f09efaa02759.png',
  month24: 'https://cdn.discordapp.com/badge-icons/ec92202290b48d0879b7413d2dde3bab.png',
};

// Other notable badge URLs
export const OTHER_BADGE_URLS = {
  partner: 'https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png',
  verifiedBot: 'https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png',
  earlySupporter: 'https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png',
  bugHunter1: 'https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png',
  bugHunter2: 'https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png',
  moderator: 'https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png',
  employee: 'https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png',
};
