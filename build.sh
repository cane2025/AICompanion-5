#!/bin/bash

# Build script for healthcare management application
echo "Starting build process..."

# Ensure we have Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
REQUIRED_VERSION="18.0.0"

if ! printf '%s\n%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V -C; then
    echo "Node.js version $NODE_VERSION is not supported. Please use Node.js 18 or higher."
    exit 1
fi

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist/
rm -rf client/dist/

# Install dependencies
echo "Installing dependencies..."
# Use pnpm to avoid npm ci lockfile strictness in CI
if command -v pnpm >/dev/null 2>&1; then
  pnpm install
else
  npm install
fi

# Build the application
echo "Building application (frontend)..."
npm run build

echo "Building application (server)..."
npx tsc -p tsconfig.server.json --force

# Verify build output
if [ ! -f "dist/server/index.js" ]; then
    echo "Build failed: dist/server/index.js not found"
    exit 1
fi

if [ ! -d "dist/public" ]; then
    echo "Build failed: client/dist directory not found"
    exit 1
fi

echo "Build completed successfully!"
echo "Run 'npm start' to start the production server"