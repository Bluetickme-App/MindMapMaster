# Railway Deployment Guide

## Prerequisites
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login to Railway: `railway login`
3. Create a Railway account at https://railway.app

## Environment Variables
Configure these in your Railway dashboard under Variables:

### Required
- `DATABASE_URL` - PostgreSQL connection string (Railway provides this automatically)

### Optional (for AI features)
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `GOOGLE_API_KEY` - Google AI API key
- `GEMINI_API_KEY` - Google Gemini API key

## Deployment Methods

### Method 1: Automated Script
```bash
# Build and deploy in one command
npm run deploy:railway
```

### Method 2: Manual Steps
```bash
# Build for Railway
npm run build:railway

# Initialize Railway project (if not done)
railway init

# Deploy to Railway
railway up
```

### Method 3: GitHub Integration
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Push to main branch - deployment happens automatically

## Configuration Files
- `railway.json` - Railway service configuration
- `nixpacks.toml` - Build configuration
- `Dockerfile` - Docker configuration (optional)
- `dist/` - Built application files

## Database Setup
1. Add PostgreSQL service in Railway dashboard
2. DATABASE_URL is automatically provided
3. Connect using Railway's database connection string

## Health Monitoring
Railway automatically monitors:
- Health check: `/health`
- Ready check: `/ready`
- Custom health check timeout: 30s

## Useful Commands
```bash
# View logs
railway logs

# Check service status
railway status

# Restart service
railway restart

# Connect to database
railway connect postgres

# Open in browser
railway open
```

## Troubleshooting

### Build Issues
- Check build logs: `railway logs --build`
- Verify all dependencies in package.json
- Ensure TypeScript compilation succeeds

### Runtime Issues
- Check application logs: `railway logs`
- Verify environment variables are set
- Monitor resource usage in dashboard

### Database Issues
- Check PostgreSQL service status
- Verify connection string
- Monitor database logs

## Scaling
- Railway automatically scales based on traffic
- Configure custom scaling in service settings
- Monitor resource usage in dashboard
- Upgrade plan for higher limits

## Railway Limits
- Starter plan: 512MB RAM, 1GB storage
- Developer plan: 8GB RAM, 100GB storage
- Team plan: Custom limits

## Custom Domain
1. Go to Railway dashboard
2. Select your service
3. Add custom domain in Settings
4. Configure DNS records as shown

## Performance Tips
- Use Railway's global edge network
- Enable health checks for better uptime
- Monitor resource usage
- Use Railway's built-in metrics
- Configure proper restart policies

## Monitoring
- View metrics in Railway dashboard
- Set up alerts for service health
- Monitor database performance
- Track deployment history