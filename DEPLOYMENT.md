# MarFebCRM Deployment Guide

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- No backend/database required - data stored locally in browser

### Local Development
```bash
npm install
npm run dev
```
App runs at `http://localhost:5173`

### Production Build
```bash
npm run build
```
Output in `dist/` directory

## Deployment Options

### 1. Static Hosting (Recommended)
**Platforms:** Vercel, Netlify, GitHub Pages, AWS S3 + CloudFront

```bash
npm run build
# Deploy the `dist/` folder
```

**Vercel (simplest):**
```bash
npm i -g vercel
vercel
```

**Netlify:**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

### 2. Node.js Hosting
Any Node.js host (Heroku, Railway, DigitalOcean, etc.)

```bash
npm install
npm run build
# Serve dist/ with any static server
```

### 3. Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "-l", "3000"]
```

## Environment Variables
None required! App is 100% client-side.

## Data & Storage
- **localStorage** for contact data (browser-native, 5-10 MB limit)
- **All data stays on user's device** (privacy-first)
- Export/Import for backup and sync across devices

## Performance
- Gzipped bundle: **~135 KB**
- Fast first load on modern browsers
- Responsive on mobile and desktop
- No external API dependencies

## Security
- No server backend = no data exposure risk
- All auth is local (user/password stored encrypted in browser)
- Export/Import for complete data control
- HTTPS recommended for production

## Troubleshooting

**"localStorage is full"** - Max ~5-10MB
- Export contacts (menu → Export Data)
- Clear browser cache/storage
- Use different browser/device

**Data not persisting** - Check if localStorage is enabled
- Private browsing disables localStorage
- Check browser storage settings
- Try different browser

**Build fails** - Clean and retry
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

## Monitoring
- No backend logs to monitor
- Check browser console for client-side errors
- Test export/import regularly

## Support
- All data is local (no server issues)
- Works offline after initial load
- Perfect for backup/restore workflows
