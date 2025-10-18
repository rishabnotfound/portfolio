# R's Portfolio

<img width="1919" height="954" alt="Portfolio Preview" src="https://github.com/user-attachments/assets/956578e4-8b0e-4b00-ab12-a8c8cbcab806" />

A stunning, feature-rich modern portfolio website built with Next.js 15, featuring real-time Discord presence, live GitHub integration, LeetCode stats, 3D animations, WebGL effects, and smooth scroll interactions.

## Features

### Core Features
- **Intro Animation**: Cinematic "WELCOME" zoom animation with canvas rendering on page load
- **Scroll Effects**: Zoom and blur effects on scroll with smooth transitions using Framer Motion
- **Scroll Indicator**: Custom scroll progress indicator
- **Parallax Effects**: Multi-layered parallax backgrounds for depth
- **3D Tilt Cards**: Interactive tilt effects on project and skill cards using `react-parallax-tilt`

### Hero Section
- **Typewriter Effect**: Animated name display with typewriter animation
- **Social Links**: Direct links to GitHub, LinkedIn, Instagram, and email
- **Navigation**: Smooth scroll to sections (Projects, Contact)
- **Resume Download**: Direct link to downloadable resume

### About Section
- **Dynamic Stats**: Real-time fetched statistics from multiple platforms
  - GitHub stats (total stars, forks, repositories)
  - LeetCode stats (problems solved, ranking, reputation)
- **Live Discord Profile Card**: Real-time Discord presence integration
  - User avatar with status indicator (online/idle/dnd/offline)
  - Discord badges and clan tags
  - Live activities display (gaming, listening to Spotify, etc.)
  - Activity timestamps with progress bars for Spotify
  - Member since date
  - Auto-refreshes every 5 seconds
  - Uses Lanyard API for presence data

### Skills Section
- **CONFIGURABLE**
- **Interactive 3D Tilt Cards** for each skill category
- **Icon Display** for each individual technology with hover effects

### Projects Section
- **Live GitHub Integration**: Automatically fetches top 6 repositories
- **Repository Details**:
  - Repository name, description, and image (extracted from README)
  - Stars, forks, and commit counts
  - Language with color-coded indicator
  - Topics/tags display
  - Links to GitHub repo and live demo (if available)
- **3D Tilt Effects** on project cards
- **View All Repos Page**: Dedicated `/repos` page showing all repositories

### Open Source Section
- **Contribution Showcase**: Displays open-source contributions
  - CONFIGURABLE
- **PR Links**: Direct links to pull requests

### Contact Section
- **Contact Information**: Email and social media links
- **Footer**: Copyright and attribution

## Tech Stack

### Frontend
- **Framework**: Next.js 15.0.0 (App Router)
- **Language**: TypeScript 5.6.3
- **UI Library**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.14
- **3D Graphics**: Three.js 0.169.0, React Three Fiber 8.17.10, Drei 9.114.3
- **Animations**: Framer Motion 11.11.11
- **Icons**: Lucide React 0.454.0
- **Scroll**: Locomotive Scroll 5.0.0-beta.21
- **Effects**: react-parallax-tilt 1.7.310
- **Typewriter**: typewriter-effect 2.22.0

### Backend & APIs
- **Runtime**: Node.js (WebSocket support with ws 8.18.3)
- **HTTP Client**: Axios 1.7.7
- **External APIs**:
  - Discord API (user profiles, avatars, badges)
  - Lanyard API (real-time Discord presence)
  - GitHub API (repositories, commits, README parsing)
  - LeetCode GraphQL API (user stats, problem counts)

### DevOps & Tooling
- **Package Manager**: npm
- **Linting**: ESLint 9.13.0
- **CSS Processing**: PostCSS 8.4.47, Autoprefixer 10.4.20

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Discord Bot Token (REQUIRED)
# Get your bot token from https://discord.com/developers/applications
# Create a bot, copy the token, and paste it here
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN_HERE

# GitHub Personal Access Token (REQUIRED)
# Generate at https://github.com/settings/tokens
# Needed for higher rate limits and private repo access
GITHUB_TOKEN=YOUR_GITHUB_TOKEN_HERE
```

### Why These Variables Are Needed

1. **DISCORD_BOT_TOKEN**
   - **Purpose**: Fetches Discord user profile data (username, avatar, badges, banner, etc.)
   - **How to Get**:
     - Go to [Discord Developer Portal](https://discord.com/developers/applications)
     - Create a new application
     - Go to "Bot" section
     - Click "Add Bot"
     - Copy the token
   - **Important**: You must also join the [Lanyard Discord server](https://discord.gg/lanyard) for RPC presence activity tracking

2. **GITHUB_TOKEN**
   - **Purpose**: Fetches GitHub repository data without rate limits
   - **How to Get**:
     - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
     - Generate new token (classic)
     - Select scopes: `public_repo`, `read:user`
     - Copy the generated token
   - **Benefits**:
     - Increases API rate limit from 60 to 5000 requests/hour
     - Access to repository commit history
     - README image extraction

## Configuration

### Personal Information (`config.js`)

Update the `config.js` file with your information:

```js
export const name = `Your Name`;
export const navbar_title = `<YourName />`;
export const github_username = `your-github-username`;
export const linkedin_username = `your-linkedin-username`;
export const instagram_username = `your-instagram-username`;
export const leetcode_username = `your-leetcode-username`;
export const contact_mail = `your@email.com`;
export const discord_userid = `your-discord-user-id`;
export const discord_pronouns = `your/pronouns`;
export const discord_bio = `Your bio text`;
```

### Discord Badges (`config/badges.ts`)

Configure custom Discord badges to display on your profile card:

```js
export const discordBadges = [
  {
    name: 'Badge Name',
    iconUrl: 'https://example.com/badge.png',
    enabled: true,
    tooltip: 'Badge description'
  }
];
```

### Open Source Contributions (`config.js`)

Add your open-source contributions:

```js
export const openSourceContributions = [
  {
    id: 1,
    repoName: 'Project Name',
    repoUrl: 'https://github.com/org/repo',
    pullRequestUrl: 'https://github.com/org/repo/pull/123',
    pullRequestNumber: 123,
    description: 'Contribution description',
    logo: 'https://example.com/logo.svg',
    logoAlt: 'Project Logo'
  }
];
```

## Installation

### Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager
- Discord Bot Token
- GitHub Personal Access Token

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/rishabnotfound/portfolio.git
cd portfolio
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Configure environment variables**
Edit `.env` and add your tokens:
```env
DISCORD_BOT_TOKEN=your_discord_bot_token
GITHUB_TOKEN=your_github_token
```

5. **Update personal configuration**
Edit `config.js` with your information

6. **Join Lanyard Discord**
Join https://discord.gg/lanyard for Discord presence features

7. **Run development server**
```bash
npm run dev
```

8. **Open your browser**
Visit [http://localhost:3000](http://localhost:3000)

## Building for Production

```bash
# Build the application
npm run build

# Start production server on port 3011
npm start
```

The production server runs on port 3011 by default (configured in `package.json`).

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Netlify

1. Push your code to GitHub
2. Connect repository on [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables
6. Deploy

### Google Cloud / VPS

1. Install Node.js on server
2. Clone repository
3. Install dependencies
4. Create `.env` file with variables
5. Build: `npm run build`
6. Run with PM2 or systemd: `npm start`
7. Configure Nginx as reverse proxy

## API Routes

The portfolio includes several API endpoints:

- **`/api/discord_profile/[id]`** - Fetches Discord user profile and live presence
- **`/api/github`** - Fetches top 6 GitHub repositories
- **`/api/github/all-repos`** - Fetches all repositories
- **`/api/github/user`** - Fetches GitHub user profile
- **`/api/leetcode_profile`** - Fetches LeetCode statistics

## Project Structure

```
portfolio/
├── app/
│   ├── api/                    # API routes
│   │   ├── discord_profile/    # Discord profile endpoint
│   │   ├── github/             # GitHub endpoints
│   │   └── leetcode_profile/   # LeetCode endpoint
│   ├── repos/                  # All repositories page
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   ├── loading.tsx             # Loading component
│   └── not-found.tsx           # 404 page
├── components/
│   ├── About.tsx               # About section
│   ├── AnimatedBackground.tsx  # Animated background
│   ├── Contact.tsx             # Contact section
│   ├── DiscordProfile.tsx      # Discord profile card
│   ├── DynamicStats.tsx        # Live stats component
│   ├── Footer.tsx              # Footer component
│   ├── Hero.tsx                # Hero section
│   ├── IntroAnimation.tsx      # Welcome animation
│   ├── Navigation.tsx          # Navigation bar
│   ├── OpenSource.tsx          # Open source contributions
│   ├── ParallaxBackground.tsx  # Parallax effects
│   ├── Projects.tsx            # Projects section
│   ├── ScrollZoomBlur.tsx      # Scroll effects
│   ├── Skills.tsx              # Skills showcase
│   └── scroll_indicator.jsx    # Scroll progress bar
├── config/
│   └── badges.ts               # Discord badges config
├── public/
│   ├── js/                     # Client-side scripts
│   ├── resume/                 # Resume files
│   ├── logo.png                # Logo
│   └── nobg.png                # Logo
├── config.js                   # Main configuration
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── .env                        # Environment variables
└── package.json                # Dependencies
```

## Troubleshooting

### Discord profile not loading
- Verify `DISCORD_BOT_TOKEN` is correct
- Check if bot has proper permissions
- Ensure Discord user ID is valid
- Confirm you've joined the Lanyard Discord server

### GitHub repos not fetching
- Verify `GITHUB_TOKEN` is valid
- Check token has `public_repo` scope
- Verify GitHub username in config.js

### Build errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Clear npm cache: `npm cache clean --force`

## License

MIT License - feel free to use this template for your own portfolio!

## Author

**R** (rishabnotfound)

---

Made with ❤️ by R
