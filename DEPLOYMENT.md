# Deployment Guide

## Quick Start

Your portfolio is now ready to deploy! Here are the recommended platforms:

## Deploy to Vercel (Recommended)

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial portfolio commit"
git push origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and configure everything
6. Click "Deploy"

That's it! Your portfolio will be live in minutes.

## Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Click "Deploy site"

## Deploy to Cloudflare Pages

1. Push your code to GitHub
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
3. Navigate to Pages
4. Click "Create a project"
5. Connect your GitHub repository
6. Framework preset: Next.js
7. Click "Save and Deploy"

## Environment Variables (Optional)

If you want to add a GitHub personal access token for higher API rate limits:

1. Create a GitHub token at https://github.com/settings/tokens
2. Add this environment variable in your deployment platform:
   - Key: `GITHUB_TOKEN`
   - Value: Your token

Then update `app/api/github/route.ts` to use it in headers:
```typescript
headers: {
  'Authorization': `token ${process.env.GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
}
```

## Custom Domain

All platforms support custom domains:
1. Add your domain in the platform settings
2. Update your DNS records as instructed
3. SSL certificates are automatically provisioned

## Performance Tips

Your portfolio is already optimized, but for even better performance:
- Enable compression in your hosting platform
- Use a CDN (most platforms include this)
- Monitor with Google Lighthouse
- Consider adding a service worker for offline support

## Troubleshooting

If you encounter issues:
- Check build logs for errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (use Node 18+)
- Clear build cache and redeploy

Enjoy your new portfolio! 🚀
