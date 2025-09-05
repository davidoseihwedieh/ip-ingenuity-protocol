#!/bin/bash

echo "Setting up PostgreSQL and Redis..."

# Install PostgreSQL and Redis via Homebrew
if ! command -v brew &> /dev/null; then
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "Installing PostgreSQL..."
brew install postgresql@15

echo "Installing Redis..."
brew install redis

echo "Starting services..."
brew services start postgresql@15
brew services start redis

echo "Creating database..."
createdb ip_ingenuity

echo "Running migrations..."
psql -d ip_ingenuity -f infrastructure/database/migrations.sql

echo "✅ Database setup complete!"