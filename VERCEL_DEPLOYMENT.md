# Vercel Deployment Guide

## Prerequisites
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Ensure your GitHub repository is connected to Vercel

## Environment Variables
Configure these in your Vercel dashboard under Settings → Environment Variables:

### Required
- `DATABASE_URL` - PostgreSQL connection string

### Optional (for AI features)
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `GOOGLE_API_KEY` - Google AI API key
- `GEMINI_API_KEY` - Google Gemini API key

## Deployment Methods

### Method 1: Automated Script
```bash
# Build and deploy in one command
npm run deploy:vercel
```

### Method 2: Manual Steps
```bash
# Build for Vercel
npm run build:vercel

# Deploy to Vercel
vercel --prod
```

### Method 3: GitHub Integration
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Push to main branch - deployment happens automatically

## Configuration Files
- `vercel.json` - Vercel deployment configuration
- `api/index.js` - Vercel serverless function handler
- `client/dist/` - Built frontend assets

## Health Monitoring
Vercel will monitor these endpoints:
- Health check: `https://your-app.vercel.app/health`
- Ready check: `https://your-app.vercel.app/ready`

## Database Setup
1. Use Neon, PlanetScale, or Supabase for PostgreSQL
2. Copy DATABASE_URL from your database provider
3. Add to Vercel environment variables

## Troubleshooting

### Build Issues
- Check function logs in Vercel dashboard
- Ensure all dependencies are listed in package.json
- Verify TypeScript compilation succeeds

### Runtime Issues
- Check function timeout (30s max for Hobby plan)
- Verify environment variables are set
- Monitor function logs for errors

### Database Issues
- Verify DATABASE_URL is correct
- Check database connection limits
- Ensure database is accessible from Vercel

## Vercel Limits
- Function timeout: 30s (Hobby), 900s (Pro)
- Function size: 50MB
- Monthly function invocations: 100k (Hobby), 1M (Pro)

## Custom Domain
1. Go to Vercel dashboard
2. Select your project
3. Add custom domain in Settings
4. Configure DNS records as shown

## Performance Tips
- Use Vercel Edge Functions for faster response times
- Enable caching for static assets
- Use Vercel Analytics for monitoring
- Implement ISR (Incremental Static Regeneration) where possible