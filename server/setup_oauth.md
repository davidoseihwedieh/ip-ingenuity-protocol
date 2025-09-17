# OAuth Setup Guide

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI: `https://yourdomain.com/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add "Facebook Login" product
4. Set Valid OAuth Redirect URI: `https://yourdomain.com/auth/facebook/callback`
5. Copy App ID and App Secret to `.env`

## Apple OAuth Setup

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a new Service ID
3. Configure Sign In with Apple
4. Set Return URL: `https://yourdomain.com/auth/apple/callback`
5. Generate private key and copy to `.env`

## Database Setup (PostgreSQL)

### Local Development
```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL
brew services start postgresql

# Create database
createdb ip_ingenuity
```

### Production (Heroku Postgres)
```bash
# Add Heroku Postgres addon
heroku addons:create heroku-postgresql:hobby-dev

# Get database URL
heroku config:get DATABASE_URL
```

## AWS S3 Setup

1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Create S3 bucket: `ip-ingenuity-files`
3. Set bucket policy for public read access
4. Create IAM user with S3 permissions
5. Copy access keys to `.env`

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
# Edit .env with your credentials
```

## Running the Server

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python app.py
```

## Deployment

### Heroku
```bash
# Create Heroku app
heroku create ip-ingenuity-api

# Set environment variables
heroku config:set GOOGLE_CLIENT_ID=your_id
heroku config:set GOOGLE_CLIENT_SECRET=your_secret
# ... set all other variables

# Deploy
git push heroku main
```

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```