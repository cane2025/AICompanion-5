#!/bin/bash

# Deployment script for healthcare management application
echo "Starting deployment process..."

# Ensure we have Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found. Please ensure Node.js 18+ is installed."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
REQUIRED_VERSION="18.0.0"

if ! printf '%s\n%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V -C; then
    echo "Error: Node.js version $NODE_VERSION is not supported. Please use Node.js 18 or higher."
    exit 1
fi

echo "Node.js version: $NODE_VERSION ✓"

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/
rm -rf client/dist/

# Install dependencies (production and dev dependencies for build)
echo "Installing dependencies..."
npm ci --production=false

if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    exit 1
fi

# Build the application
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "Error: Build failed"
    exit 1
fi

# Verify build output
if [ ! -f "dist/index.js" ]; then
    echo "Error: dist/index.js not found after build"
    exit 1
fi

if [ ! -d "dist/public" ]; then
    echo "Error: dist/public directory not found after build"
    exit 1
fi

echo "✓ Build completed successfully!"
echo "✓ Server bundle: dist/index.js"
echo "✓ Client assets: dist/public/"
echo ""
echo "Deployment ready! The application can be started with:"
echo "  NODE_ENV=production node dist/index.js"