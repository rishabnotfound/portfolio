# Troubleshooting Guide

## Common Issues and Solutions

### Hydration Errors

**Issue**: Console warnings about hydration mismatches

**Solution**: Already fixed in the code with:
- `suppressHydrationWarning` on html and body tags
- Proper SSR checks for `document` and `window` access
- Dynamic import for 3D components with `ssr: false`

If you still see warnings, they're usually harmless and won't affect functionality.

---

### Build Errors

**Issue**: Build fails with module not found errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

---

### 3D Scene Not Loading

**Issue**: Black screen or no 3D animations

**Solutions**:
1. Check browser console for WebGL errors
2. Ensure your browser supports WebGL (most modern browsers do)
3. Try disabling browser extensions that might block WebGL
4. Update your graphics drivers

**Test WebGL**: Visit https://get.webgl.org/

---

### GitHub API Rate Limit

**Issue**: Repositories not loading or "403" errors

**Solution**: Add a GitHub personal access token

1. Create token at https://github.com/settings/tokens
2. Add environment variable:
   - Create `.env.local` file
   - Add: `GITHUB_TOKEN=your_token_here`
3. Update `app/api/github/route.ts`:
```typescript
headers: {
  'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
}
```

---

### Slow Performance

**Issue**: Animations are laggy or choppy

**Solutions**:
1. Reduce particle count in `components/Scene3D.tsx` (line 38)
2. Disable animations if on low-end device:
```typescript
// In Scene3D.tsx
const count = 500; // Instead of 2000
```
3. Disable Three.js antialiasing:
```typescript
// In Scene3D.tsx
<Canvas gl={{ antialias: false, alpha: true }}>
```

---

### Mobile Issues

**Issue**: Layout breaks on mobile or touch events don't work

**Solutions**:
1. Clear browser cache
2. Test in Chrome DevTools mobile emulation
3. Check viewport meta tag exists (it's in layout.tsx by default)
4. Ensure touch events work by testing the mobile menu

---

### Deployment Issues

**Issue**: Build succeeds locally but fails on Vercel/Netlify

**Common Causes**:
1. **Node version**: Ensure platform uses Node 18+
2. **Environment variables**: Add any env vars in platform settings
3. **Build command**: Should be `npm run build` or `next build`
4. **Output directory**: Should be `.next` for most platforms

**Vercel**: Usually auto-detects everything
**Netlify**: Might need manual build settings
**Cloudflare**: Select Next.js framework preset

---

### TypeScript Errors

**Issue**: Type errors during development

**Solution**:
```bash
# Regenerate TypeScript types
rm -rf .next
npm run dev
```

If errors persist, check `tsconfig.json` has:
- `"strict": true`
- `"skipLibCheck": true`

---

### CSS Not Loading

**Issue**: No styles or white background

**Solutions**:
1. Ensure Tailwind is properly configured
2. Check `globals.css` is imported in `layout.tsx`
3. Verify PostCSS config exists
4. Clear `.next` folder and rebuild

---

### Contact Form Not Working

**Issue**: Form submits but nothing happens

**Current Status**: The form is currently a demo (simulates sending)

**To Make It Real**:
1. Add a serverless function/API route
2. Use a service like:
   - **FormSpree**: Easy email forwarding
   - **SendGrid**: Email API
   - **Resend**: Modern email API

Example with FormSpree:
```tsx
// In Contact.tsx handleSubmit
const response = await fetch('https://formspree.io/f/YOUR_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
});
```

---

### Browser Compatibility

**Issue**: Site doesn't work in older browsers

**Minimum Requirements**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**For Older Browsers**: Consider adding polyfills or showing an upgrade message

---

### Performance Optimization

**Tips for Better Performance**:

1. **Lazy Load Images**:
```tsx
import Image from 'next/image';
// Use Next.js Image component
```

2. **Reduce Animation Complexity**:
- Lower particle count
- Reduce blur effects
- Simplify gradient animations

3. **Enable Caching**:
- GitHub API is already cached (1 hour)
- Add CDN caching headers if self-hosting

4. **Optimize Build**:
```bash
npm run build -- --profile
```

---

## Still Having Issues?

1. Check the console for specific error messages
2. Search the error on Google/Stack Overflow
3. Check Next.js documentation: https://nextjs.org/docs
4. Check Three.js docs: https://threejs.org/docs
5. Verify all dependencies are up to date: `npm outdated`

## Quick Fixes

**Reset Everything**:
```bash
rm -rf node_modules .next package-lock.json
npm install
npm run dev
```

**Check for Syntax Errors**:
```bash
npm run lint
```

**Verify Build**:
```bash
npm run build
```

---

## Development Tools

Recommended browser extensions:
- React Developer Tools
- Redux DevTools (if you add Redux)
- Lighthouse (for performance audits)

---

Need more help? Check the main README.md and DEPLOYMENT.md files!
