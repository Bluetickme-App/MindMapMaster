import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureProduction, validateEnvironment } from "./production-config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Configure environment-specific settings
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Validate environment and configure production settings
      if (!validateEnvironment()) {
        console.error('❌ Environment validation failed');
        process.exit(1);
      }
      configureProduction(app);
    }
    
    // Add health check endpoint for autoscale service (before other routes)
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        production: isProduction
      });
    });

    // Add readiness check endpoint
    app.get('/ready', (req, res) => {
      res.status(200).json({ 
        status: 'ready', 
        timestamp: new Date().toISOString(),
        database: !!process.env.DATABASE_URL,
        port: 5000,
        production: isProduction
      });
    });

    const server = await registerRoutes(app);

    // Enhanced error handler - removed throw statement for production
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log error for debugging but don't throw in production
      console.error('Application error:', err);
      
      res.status(status).json({ message });
      
      // Only throw in development mode
      if (app.get("env") === "development") {
        throw err;
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    
    // Add graceful shutdown handlers
    const gracefulShutdown = () => {
      log('Received shutdown signal, closing server gracefully...');
      server.close(() => {
        log('Server closed successfully');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      log(`Environment: ${app.get("env")}`);
      log(`Health check available at /health`);
      log(`Ready check available at /ready`);
      
      // Signal successful startup for deployment
      if (process.env.NODE_ENV === 'production') {
        console.log('🚀 Production server successfully started');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    // Add timeout handling for production
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Production server startup failed');
      setTimeout(() => {
        console.error('⏰ Server startup timeout - exiting');
        process.exit(1);
      }, 30000); // 30 second timeout
    } else {
      process.exit(1);
    }
  }
})();
