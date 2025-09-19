# Quick OAuth Setup Guide

## What You Need for OAuth to Work

Your website is currently **static** (hosted on Vercel), but OAuth requires a **backend server** to handle authentication. Here's what you need:

## Option 1: Deploy Backend Server (Recommended)

### 1. Choose a Platform
- **Railway** (Easiest): Free tier, auto-deploy from GitHub
- **Heroku** (Popular): Free tier available
- **Render** (Simple): Good free tier

### 2. Quick Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### 3. Set Environment Variables
```bash
# In Railway dashboard, add these:
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DATABASE_URL=postgresql://...
SECRET_KEY=your_secret_key
```

### 4. Configure OAuth Apps

#### Google OAuth (5 minutes)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Set redirect URI: `https://your-railway-app.railway.app/auth/google/callback`
5. Copy Client ID/Secret to Railway

#### Facebook OAuth (5 minutes)
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create app → Add Facebook Login
3. Set redirect URI: `https://your-railway-app.railway.app/auth/facebook/callback`
4. Copy App ID/Secret to Railway

## Option 2: Use Serverless Functions (Alternative)

### Vercel Functions
Create `/api/auth/[...provider].js`:
```javascript
import { OAuth } from 'oauth4webapi'

export default async function handler(req, res) {
  const { provider } = req.query
  
  if (provider === 'google') {
    // Handle Google OAuth
    const authUrl = `https://accounts.google.com/oauth/authorize?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=email profile`
    res.redirect(authUrl)
  }
}
```

## Option 3: Use Auth Service (Fastest)

### Supabase Auth (No backend needed)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Sign in with Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
})
```

### Auth0 (Enterprise grade)
```javascript
import { Auth0Provider } from '@auth0/auth0-react'

// Wrap your app
<Auth0Provider
  domain="your-domain.auth0.com"
  clientId="your-client-id"
  redirectUri={window.location.origin}
>
  <App />
</Auth0Provider>
```

## Recommended: Railway + PostgreSQL

**Why Railway?**
- ✅ Free tier with PostgreSQL
- ✅ Auto-deploy from GitHub
- ✅ Built-in environment variables
- ✅ Custom domains
- ✅ Easy scaling

**Setup Time**: ~15 minutes
**Cost**: Free for development

## Quick Start Commands

```bash
# 1. Deploy to Railway
cd server
railway login
railway init
railway up

# 2. Add database
railway add postgresql

# 3. Set environment variables in Railway dashboard
# 4. Configure OAuth apps with Railway URL
# 5. Update website to use Railway API URL
```

## Update Website

Once deployed, update your website:
```javascript
// Change API calls from localhost to your Railway URL
const API_BASE = 'https://your-app.railway.app'

async function loginWithProvider(provider) {
  window.location.href = `${API_BASE}/auth/${provider}`
}
```

## Cost Breakdown

- **Railway**: Free tier (500 hours/month)
- **PostgreSQL**: Included in Railway
- **OAuth Apps**: Free (Google, Facebook, Apple)
- **Domain**: Optional (~$10/year)

**Total**: $0 for development, ~$5-10/month for production

Would you like me to help you deploy to Railway or set up one of the other options?