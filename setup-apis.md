# API Keys Setup Guide

## 1. Alpha Vantage (Free - 5 calls/minute, 500/day)
1. Go to: https://www.alphavantage.co/support/#api-key
2. Enter your email
3. Copy your API key
4. Replace `'demo'` in `api-config.js` with your key

## 2. IEX Cloud (Free - 50,000 calls/month)
1. Go to: https://iexcloud.io/pricing/
2. Click "Start Free"
3. Sign up with email
4. Go to Console → API Tokens
5. Copy "Publishable" key (starts with pk_)
6. Replace `'pk_test_demo'` in `api-config.js`

## 3. Update api-config.js
```javascript
const API_CONFIG = {
    ALPHA_VANTAGE_KEY: 'YOUR_ALPHA_VANTAGE_KEY_HERE',
    IEX_CLOUD_KEY: 'YOUR_IEX_CLOUD_KEY_HERE',
    DEMO_MODE: false  // Set to false once you have real keys
};
```

## 4. Test Your Setup
- Refresh your website
- Check browser console for any API errors
- Data should update with real market prices

**Total setup time: 2-3 minutes**