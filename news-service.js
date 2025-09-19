class NewsService {
    constructor() {
        this.newsCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async fetchNews() {
        try {
            // Mock news data for now - in production, integrate with NewsAPI, Bloomberg, etc.
            const mockNews = {
                ipNews: [
                    {
                        id: 1,
                        title: "USPTO Reports Record Patent Applications in Q4 2024",
                        summary: "Patent filings surge 23% as AI and quantum computing innovations drive intellectual property growth.",
                        category: "Patents",
                        time: "2 hours ago",
                        source: "USPTO",
                        trending: true
                    },
                    {
                        id: 2,
                        title: "Quantum Computing Patents Face New Security Challenges",
                        summary: "Industry experts warn of vulnerabilities in current IP protection methods as quantum threat emerges.",
                        category: "Quantum",
                        time: "4 hours ago",
                        source: "Nature",
                        trending: false
                    },
                    {
                        id: 3,
                        title: "Blockchain IP Tokenization Market Reaches $2.1B",
                        summary: "Growing adoption of tokenized intellectual property creates new investment opportunities.",
                        category: "Blockchain",
                        time: "6 hours ago",
                        source: "CoinDesk",
                        trending: true
                    }
                ],
                marketNews: [
                    {
                        id: 4,
                        title: "Tech Stocks Rally on AI Patent Surge",
                        summary: "Major technology companies see stock prices rise following increased AI patent portfolios.",
                        category: "Markets",
                        time: "1 hour ago",
                        source: "Reuters",
                        trending: true
                    },
                    {
                        id: 5,
                        title: "IP Investment Funds Outperform Traditional Assets",
                        summary: "Intellectual property-focused investment vehicles show 18% returns year-to-date.",
                        category: "Investment",
                        time: "3 hours ago",
                        source: "Financial Times",
                        trending: false
                    },
                    {
                        id: 6,
                        title: "Regulatory Framework for IP Tokens Proposed",
                        summary: "SEC considers new guidelines for intellectual property tokenization and trading.",
                        category: "Regulation",
                        time: "5 hours ago",
                        source: "Wall Street Journal",
                        trending: true
                    }
                ]
            };

            this.newsCache.set('news', {
                data: mockNews,
                timestamp: Date.now()
            });

            return mockNews;
        } catch (error) {
            console.error('Error fetching news:', error);
            return this.getFallbackNews();
        }
    }

    getFallbackNews() {
        return {
            ipNews: [
                {
                    id: 1,
                    title: "IP Market Update",
                    summary: "Latest developments in intellectual property markets.",
                    category: "General",
                    time: "Now",
                    source: "Provenance",
                    trending: false
                }
            ],
            marketNews: [
                {
                    id: 2,
                    title: "Market Analysis",
                    summary: "Current market conditions and trends.",
                    category: "Markets",
                    time: "Now",
                    source: "Provenance",
                    trending: false
                }
            ]
        };
    }

    async getNews() {
        const cached = this.newsCache.get('news');
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        return await this.fetchNews();
    }

    renderNewsSection(containerId, newsData, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="news-header">
                <h2>${title}</h2>
                <a href="#" class="view-all">View All</a>
            </div>
            <div class="news-grid">
                ${newsData.map(article => `
                    <article class="news-card ${article.trending ? 'trending' : ''}">
                        <div class="news-meta">
                            <span class="news-category">${article.category}</span>
                            <span class="news-time">${article.time}</span>
                            ${article.trending ? '<span class="trending-badge">Trending</span>' : ''}
                        </div>
                        <h3 class="news-title">${article.title}</h3>
                        <p class="news-summary">${article.summary}</p>
                        <div class="news-footer">
                            <span class="news-source">${article.source}</span>
                            <button class="read-more">Read More</button>
                        </div>
                    </article>
                `).join('')}
            </div>
        `;
    }

    async initializeNews() {
        try {
            const news = await this.getNews();
            this.renderNewsSection('ip-news', news.ipNews, 'IP & Innovation News');
            this.renderNewsSection('market-news', news.marketNews, 'Market & Trading News');
        } catch (error) {
            console.error('Failed to initialize news:', error);
        }
    }
}

// Initialize news service
const newsService = new NewsService();