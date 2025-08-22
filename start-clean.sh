#!/bin/bash

# 🚀 UNGDOMS Öppenvård - Clean Start Script för Wrap.dev
echo "🚀 Starting UNGDOMS Öppenvård - Clean Environment"
echo "================================================"

# Kill any existing processes
echo "🛑 Stopping existing processes..."
pkill -f "vite" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true
sleep 2

# Clean install
echo "📦 Installing dependencies..."
npm ci

# Verify TypeScript
echo "🔍 Checking TypeScript..."
npm run check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Please fix before starting."
    exit 1
fi

echo "✅ Environment ready!"
echo ""
echo "🌐 Next steps:"
echo "1. Terminal 1: PORT=3001 NODE_ENV=development npm run dev"
echo "2. Terminal 2: npx vite --port 5175 --strictPort --host 127.0.0.1"
echo "3. Open: http://127.0.0.1:5175"
echo ""
echo "🤖 For Wrap.dev: Use URL http://127.0.0.1:5175"
echo "📋 See WRAP_DEV_SETUP.md for agent configurations"
