#!/bin/bash

# Build script for sports-service

echo "🔧 Building Sports Service..."

# Navigate to sports-service directory
cd apps/sports-service

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build the application
echo "⚙️ Building application..."
npx tsc -p tsconfig.json

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📦 Output directory: apps/sports-service/dist"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🚀 Ready to start the service with: npm run start:prod"
