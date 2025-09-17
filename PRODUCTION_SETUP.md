# Production Server Setup Guide

## 🏗️ Architecture Overview

**Complete production-ready server with:**
- ✅ **OAuth Authentication**: Google, Facebook, Apple ID login
- ✅ **PostgreSQL Database**: User accounts, IP assets, token campaigns
- ✅ **AWS S3 Storage**: Secure file uploads and storage
- ✅ **Session Management**: Secure user sessions
- ✅ **RESTful API**: Complete backend for tokenization platform

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd server
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Setup OAuth Providers

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Create OAuth 2.0 credentials
4. Set redirect URI: `https://yourdomain.com/auth/google/callback`
5. Add credentials to `.env`

#### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create app → Add Facebook Login
3. Set redirect URI: `https://yourdomain.com/auth/facebook/callback`
4. Add App ID/Secret to `.env`

#### Apple OAuth
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create Service ID → Configure Sign In with Apple
3. Set return URL: `https://yourdomain.com/auth/apple/callback`
4. Add credentials to `.env`

### 4. Setup Database (PostgreSQL)

#### Local Development
```bash
# Install PostgreSQL
brew install postgresql
brew services start postgresql
createdb ip_ingenuity
```

#### Production (Heroku Postgres)
```bash
heroku addons:create heroku-postgresql:hobby-dev
heroku config:get DATABASE_URL
```

### 5. Setup AWS S3
1. Create S3 bucket: `ip-ingenuity-files`
2. Create IAM user with S3 permissions
3. Add credentials to `.env`

### 6. Deploy
```bash
./deploy.sh
```

## 📊 Database Schema

### Users Table
```sql
users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255),
    provider VARCHAR(50),
    provider_id VARCHAR(255),
    avatar_url TEXT,
    wallet_address VARCHAR(42),
    created_at TIMESTAMP,
    last_login TIMESTAMP
)
```

### IP Assets Table
```sql
ip_assets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    legal_status VARCHAR(50),
    file_urls TEXT[],
    content_hash VARCHAR(64),
    ai_valuation JSONB,
    tier VARCHAR(20),
    tokens_earned INTEGER,
    created_at TIMESTAMP
)
```

### Token Campaigns Table
```sql
token_campaigns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    ip_asset_id INTEGER REFERENCES ip_assets(id),
    name VARCHAR(255),
    total_supply BIGINT,
    token_price DECIMAL(18,8),
    funding_target DECIMAL(18,8),
    funds_raised DECIMAL(18,8),
    royalty_percent INTEGER,
    deadline TIMESTAMP,
    active BOOLEAN,
    created_at TIMESTAMP
)
```

## 🔌 API Endpoints

### Authentication
- `GET /auth/<provider>` - Initiate OAuth login
- `GET /auth/<provider>/callback` - OAuth callback
- `GET /api/user` - Get current user
- `GET /logout` - Sign out

### IP Management
- `POST /api/upload_ip` - Upload IP asset with files
- `GET /api/user_data` - Get user's assets, campaigns, investments

### Tokenization
- `POST /api/create_campaign` - Create token campaign
- `GET /api/campaigns` - List all active campaigns
- `POST /api/invest` - Invest in campaign

## 🔐 Security Features

- **OAuth 2.0**: Secure third-party authentication
- **Session Management**: Encrypted user sessions
- **File Upload Security**: S3 with access controls
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Controlled cross-origin requests

## 🌐 Deployment Options

### Heroku
```bash
heroku create ip-ingenuity-api
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set GOOGLE_CLIENT_ID=your_id
git push heroku main
```

### Railway
```bash
railway login
railway init
railway up
```

### AWS EC2
```bash
# Launch EC2 instance
# Install dependencies
# Configure nginx reverse proxy
# Setup SSL with Let's Encrypt
```

## 🧪 Testing

### Local Testing
```bash
# Start server
python app.py

# Test endpoints
curl http://localhost:5000/api/user
```

### Authentication Flow
1. Visit `http://localhost:5000/auth-integration.html`
2. Click OAuth provider or demo mode
3. Complete authentication
4. Redirected to main platform

## 📱 Frontend Integration

### Update Website
```javascript
// Check authentication
const response = await fetch('/api/user', {
    credentials: 'include'
});

// Upload IP with files
const formData = new FormData();
formData.append('title', 'My IP Asset');
formData.append('files', fileInput.files[0]);

const result = await fetch('/api/upload_ip', {
    method: 'POST',
    body: formData,
    credentials: 'include'
});
```

## 🔧 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
FACEBOOK_CLIENT_ID=your_facebook_id
FACEBOOK_CLIENT_SECRET=your_facebook_secret
APPLE_CLIENT_ID=your_apple_id
APPLE_CLIENT_SECRET=your_apple_secret

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET_NAME=ip-ingenuity-files

# Security
SECRET_KEY=your_super_secret_key
```

## 🚨 Production Checklist

- [ ] Configure all OAuth providers
- [ ] Set up production database
- [ ] Configure S3 bucket with proper permissions
- [ ] Set strong SECRET_KEY
- [ ] Enable HTTPS/SSL
- [ ] Configure domain and DNS
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test all authentication flows
- [ ] Verify file upload functionality

## 📞 Support

**Ready for Production** ✅
- Complete OAuth integration
- Secure file storage
- Scalable database design
- Production deployment scripts
- Comprehensive documentation

Your IP tokenization platform now has enterprise-grade user authentication and data management!