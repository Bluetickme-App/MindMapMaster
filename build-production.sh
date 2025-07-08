#!/bin/bash

# Production build script with comprehensive error handling
set -e

echo "🚀 Starting production build..."

# Environment validation
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is required for production deployment"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build frontend
echo "⚛️  Building frontend..."
npm run build

# Validate build
echo "🔍 Validating build..."
if [ ! -f "dist/index.js" ]; then
    echo "❌ Backend build failed - dist/index.js not found"
    exit 1
fi

if [ ! -f "dist/client/index.html" ]; then
    echo "❌ Frontend build failed - dist/client/index.html not found"
    exit 1
fi

# Set production environment
export NODE_ENV=production

echo "✅ Production build completed successfully"
echo "📁 Build artifacts:"
echo "   - dist/index.js (server)"
echo "   - dist/client/ (frontend)"
echo "🚀 Ready for deployment"