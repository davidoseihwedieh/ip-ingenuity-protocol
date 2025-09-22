const config = {
  production: 'https://ip-ingenuity-protocol.vercel.app',
  development: 'http://localhost:3000'
};

const baseURL = window.location.hostname.includes('vercel.app') 
  ? config.production 
  : config.development;

window.APP_CONFIG = { baseURL };