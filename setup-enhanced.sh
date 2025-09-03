#!/bin/bash

echo "🚀 Setting up Enhanced Care Planning System"
echo "==========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please configure your database and email settings."
    echo "⚠️  Edit .env file with your actual configuration before proceeding."
else
    echo "✅ .env file already exists"
fi

# Ask user about database setup
echo ""
echo "🗄️ Database Setup"
echo "=================="
echo "Do you want to set up the database now? (y/n)"
read -r setup_db

if [ "$setup_db" = "y" ] || [ "$setup_db" = "Y" ]; then
    # Check if DATABASE_URL is configured
    if grep -q "DATABASE_URL=postgresql://" .env; then
        echo "🔧 Running database migrations..."
        npm run migrate
        
        if [ $? -eq 0 ]; then
            echo "✅ Database migrations completed successfully"
        else
            echo "⚠️  Database migrations failed. Please check your DATABASE_URL configuration."
        fi
    else
        echo "⚠️  Please configure DATABASE_URL in .env file first"
    fi
fi

echo ""
echo "🎯 Setup Complete!"
echo "=================="
echo ""
echo "Available commands:"
echo "  npm run dev       - Start in development mode (file storage)"
echo "  npm run dev:db    - Start in database mode (PostgreSQL)"
echo "  npm run migrate   - Run database migrations"
echo "  npm run prod      - Start in production mode"
echo ""
echo "Enhanced Features:"
echo "  ✅ Database integration with PostgreSQL"
echo "  ✅ User management and authentication"
echo "  ✅ PDF generation for reports"
echo "  ✅ Email notification system"
echo "  ✅ Calendar integration"
echo "  ✅ Dashboard with charts and statistics"
echo "  ✅ Advanced search and filtering"
echo "  ✅ Bulk operations"
echo "  ✅ Data export/import"
echo ""
echo "📚 Documentation:"
echo "  - See ENHANCED_FEATURES.md for detailed feature documentation"
echo "  - See .env.example for configuration options"
echo ""
echo "🚀 To start the application:"
echo "  1. Configure .env file with your settings"
echo "  2. Run 'npm run migrate' to set up the database (if using database mode)"
echo "  3. Run 'npm run dev' or 'npm run dev:db' to start the server"
echo ""
echo "Happy coding! 🎉"
