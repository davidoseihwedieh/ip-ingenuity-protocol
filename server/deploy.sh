#!/bin/bash

echo "🚀 IP Ingenuity Server Deployment Script"
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure your settings."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Database setup
echo "🗄️ Setting up database..."
python -c "
from app import init_database
try:
    init_database()
    print('✅ Database initialized successfully')
except Exception as e:
    print(f'❌ Database setup failed: {e}')
    exit(1)
"

# Check OAuth configuration
echo "🔐 Checking OAuth configuration..."
python -c "
import os
from dotenv import load_dotenv
load_dotenv()

required_vars = [
    'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL', 'SECRET_KEY'
]

missing = [var for var in required_vars if not os.getenv(var)]
if missing:
    print(f'❌ Missing environment variables: {missing}')
    print('Please configure these in your .env file')
    exit(1)
else:
    print('✅ OAuth configuration looks good')
"

# Start server
echo "🌐 Starting server..."
echo "Server will be available at: http://localhost:5000"
echo "Authentication page: http://localhost:5000/auth-integration.html"
echo ""
echo "Press Ctrl+C to stop the server"

python app.py