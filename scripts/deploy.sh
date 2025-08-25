#!/bin/bash

# UNGDOMS Öppenvård - Production Deployment Script
set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="ungdoms-oppenvard"
DEPLOY_PATH="/var/www/ungdoms-oppenvard"
BACKUP_PATH="/var/backups/ungdoms-oppenvard"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found, installing..."
    npm install -g pm2
fi

# Check if Docker is installed (for database)
if ! command -v docker &> /dev/null; then
    print_warning "Docker not found, database will need to be set up manually"
fi

print_status "Pre-deployment checks passed"

# Create backup
print_status "Creating backup..."
mkdir -p $BACKUP_PATH
if [ -d "$DEPLOY_PATH" ]; then
    tar -czf "$BACKUP_PATH/backup_$(date +%Y%m%d_%H%M%S).tar.gz" -C $DEPLOY_PATH .
    print_status "Backup created"
else
    print_warning "No existing deployment found, skipping backup"
fi

# Create deployment directory
print_status "Setting up deployment directory..."
sudo mkdir -p $DEPLOY_PATH
sudo chown $USER:$USER $DEPLOY_PATH

# Copy files
print_status "Copying application files..."
cp -r . $DEPLOY_PATH/
cd $DEPLOY_PATH

# Install dependencies
print_status "Installing dependencies..."
npm ci --only=production

# Build application
print_status "Building application..."
npm run build

# Create logs directory
print_status "Setting up logging..."
mkdir -p logs

# Create data directories
print_status "Setting up data directories..."
sudo mkdir -p /var/lib/ungdoms-oppenvard/data
sudo mkdir -p /var/lib/ungdoms-oppenvard/backups
sudo chown $USER:$USER /var/lib/ungdoms-oppenvard/data
sudo chown $USER:$USER /var/lib/ungdoms-oppenvard/backups

# Set up environment variables
print_status "Setting up environment variables..."
if [ ! -f ".env.production" ]; then
    print_warning "No .env.production found, creating template..."
    cat > .env.production << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://ungdoms_user:secure_password@localhost:5432/ungdoms
SESSION_SECRET=your_very_long_random_session_secret_here
JWT_SECRET=your_very_long_random_jwt_secret_here
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=info
ENABLE_AUDIT_LOGS=true
STORAGE_PATH=/var/lib/ungdoms-oppenvard/data
BACKUP_PATH=/var/lib/ungdoms-oppenvard/backups
EOF
    print_warning "Please update .env.production with your actual values"
fi

# Start/restart application with PM2
print_status "Starting application with PM2..."
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Set up PM2 startup script
pm2 startup

print_status "Deployment completed successfully!"

# Health check
print_status "Running health check..."
sleep 5
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_status "Health check passed ✅"
else
    print_error "Health check failed ❌"
    print_status "Check logs with: pm2 logs $APP_NAME"
    exit 1
fi

# Display status
print_status "Application status:"
pm2 status

print_status "Logs location: $DEPLOY_PATH/logs"
print_status "Data location: /var/lib/ungdoms-oppenvard/data"
print_status "Backup location: $BACKUP_PATH"

echo ""
print_status "🚀 Deployment completed! Your application is now running."
print_status "Access your application at: http://localhost:3001"
print_status "Monitor with: pm2 monit"
print_status "View logs with: pm2 logs $APP_NAME"


