// Production deployment configuration
import { Express } from 'express';

export function configureProduction(app: Express) {
  // Set production environment
  app.set('env', 'production');
  
  // Add production-specific middleware
  app.set('trust proxy', 1);
  
  // Add security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
  
  // Add production logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });
  
  // Environment validation
  const requiredEnvVars = ['DATABASE_URL'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ Production configuration loaded');
  console.log(`📊 Environment variables check:`);
  console.log(`   - DATABASE_URL: ${!!process.env.DATABASE_URL}`);
  console.log(`   - OPENAI_API_KEY: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`   - ANTHROPIC_API_KEY: ${!!process.env.ANTHROPIC_API_KEY}`);
  console.log(`   - GOOGLE_API_KEY: ${!!process.env.GOOGLE_API_KEY}`);
  console.log(`   - GEMINI_API_KEY: ${!!process.env.GEMINI_API_KEY}`);
}

export function validateEnvironment() {
  const checks = [
    { name: 'Database', required: true, present: !!process.env.DATABASE_URL },
    { name: 'OpenAI', required: false, present: !!process.env.OPENAI_API_KEY },
    { name: 'Anthropic', required: false, present: !!process.env.ANTHROPIC_API_KEY },
    { name: 'Google/Gemini', required: false, present: !!(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) }
  ];
  
  const failed = checks.filter(check => check.required && !check.present);
  
  if (failed.length > 0) {
    console.error('❌ Environment validation failed:');
    failed.forEach(check => console.error(`   - ${check.name} is required but not configured`));
    return false;
  }
  
  console.log('✅ Environment validation passed');
  return true;
}