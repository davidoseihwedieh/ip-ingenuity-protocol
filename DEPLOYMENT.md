# IP Ingenuity Protocol - Deployment Guide

## Quick Railway Deployment (Recommended)

Your backend is ready for deployment! Follow these steps:

### 1. Railway Deployment (No CLI needed)
1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `davidoseihwedieh/ip-ingenuity-protocol`
5. Railway will auto-detect Python and deploy using `production-app.py`

### 2. Environment Variables (Optional)
- `PORT`: Auto-set by Railway
- `FLASK_ENV`: production (default)

### 3. Your Backend Endpoints
Once deployed, your backend will be available at:
- `https://your-app.railway.app/predict` - Patent valuation API
- `https://your-app.railway.app/chat` - AI chat API  
- `https://your-app.railway.app/health` - Health check

### 4. Update Frontend
After deployment, update the API URLs in your frontend files:
```javascript
// Replace localhost:8081 with your Railway URL
const API_BASE = 'https://your-app.railway.app';
```

## Alternative: Render Deployment
1. Go to [render.com](https://render.com)
2. Connect GitHub repo
3. Create Web Service
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `gunicorn production-app:app --bind 0.0.0.0:$PORT`

## Local Testing
```bash
python production-app.py
# Backend runs on http://localhost:8081
```

## Files Ready for Deployment
✅ `production-app.py` - Flask backend with ML model
✅ `requirements.txt` - Dependencies
✅ `Procfile` - Heroku configuration
✅ `railway.json` - Railway configuration
✅ `nixpacks.toml` - Build configuration

Your production backend includes:
- Ensemble ML model with 0.648 correlation
- Patent valuation API with validated coefficients
- AI chat functionality
- Health check endpoint
- CORS support for frontend integration