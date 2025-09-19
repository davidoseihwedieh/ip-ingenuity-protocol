import asyncio
import aioredis
import asyncpg
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from concurrent.futures import ThreadPoolExecutor
import numpy as np

app = FastAPI(title="IP Ingenuity Scalable API", version="2.0.0")

# Performance optimizations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScalableValuationEngine:
    def __init__(self):
        self.redis = None
        self.db_pool = None
        self.executor = ThreadPoolExecutor(max_workers=10)
    
    async def init_connections(self):
        self.redis = await aioredis.from_url("redis://localhost:6379")
        self.db_pool = await asyncpg.create_pool(
            "postgresql://postgres:password@localhost:5432/ip_ingenuity",
            min_size=5, max_size=20
        )
    
    async def cached_valuation(self, ip_hash: str, ip_data: dict):
        # Check cache first
        cached = await self.redis.get(f"valuation:{ip_hash}")
        if cached:
            return eval(cached)
        
        # Compute valuation asynchronously
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            self.executor, self._compute_valuation, ip_data
        )
        
        # Cache result for 1 hour
        await self.redis.setex(f"valuation:{ip_hash}", 3600, str(result))
        return result
    
    def _compute_valuation(self, ip_data):
        # Optimized valuation computation
        technical = self._fast_technical_analysis(ip_data)
        market = self._fast_market_analysis(ip_data)
        financial = self._fast_financial_analysis(ip_data)
        
        weighted = technical * 0.4 + market * 0.35 + financial * 0.25
        confidence = min(100, (technical + market + financial) / 3 * 100)
        
        return {
            'valuation': ip_data.get('base_valuation', 1000000) * weighted,
            'confidence': confidence,
            'breakdown': {'technical': technical, 'market': market, 'financial': financial}
        }
    
    def _fast_technical_analysis(self, data):
        claims = len(data.get('claims', []))
        desc_length = len(data.get('description', ''))
        return min(1.0, (claims * 0.1 + desc_length * 0.001))
    
    def _fast_market_analysis(self, data):
        industry_scores = {'ai': 0.9, 'blockchain': 0.8, 'biotech': 0.85}
        return industry_scores.get(data.get('industry', ''), 0.5)
    
    def _fast_financial_analysis(self, data):
        revenue = data.get('financial_data', {}).get('projected_annual_revenue', 0)
        return min(1.0, revenue / 10000000)

engine = ScalableValuationEngine()

@app.on_event("startup")
async def startup():
    await engine.init_connections()

@app.post("/api/v2/valuation/batch")
async def batch_valuation(assets: list):
    tasks = []
    for asset in assets:
        ip_hash = hash(str(asset))
        tasks.append(engine.cached_valuation(str(ip_hash), asset))
    
    results = await asyncio.gather(*tasks)
    return {"results": results, "count": len(results)}

@app.get("/api/v2/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0", "performance": "optimized"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=4)