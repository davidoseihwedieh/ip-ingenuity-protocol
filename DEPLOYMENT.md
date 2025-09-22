# Deployment Workflow

Your workflow is now super simple:

```bash
git add .
git commit -m "Update content"
git push
```

## Vercel automatically:
1. Detects the push
2. Builds your site  
3. Deploys globally
4. Updates your live URL

## Live URLs:
- **Production**: https://ip-ingenuity-protocol.vercel.app
- **Railway**: https://your-railway-app.railway.app

## Analytics:
- Vercel Analytics enabled on all pages
- Track page views, performance, and user engagement

## Configuration:
- Environment detection via `config.js`
- Static files served from `public/` directory
- Nginx container for Railway deployment