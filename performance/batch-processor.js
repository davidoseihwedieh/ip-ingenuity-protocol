const EventEmitter = require('events');
const cache = require('./caching/redis-cache');

class BatchProcessor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.batchSize = options.batchSize || 100;
        this.flushInterval = options.flushInterval || 5000;
        this.maxWaitTime = options.maxWaitTime || 10000;
        
        this.batches = new Map();
        this.timers = new Map();
        
        this.startProcessor();
    }

    startProcessor() {
        setInterval(() => {
            this.processExpiredBatches();
        }, 1000);
    }

    async addToBatch(batchKey, item) {
        if (!this.batches.has(batchKey)) {
            this.batches.set(batchKey, {
                items: [],
                createdAt: Date.now(),
                callbacks: []
            });
        }

        const batch = this.batches.get(batchKey);
        
        return new Promise((resolve, reject) => {
            batch.items.push(item);
            batch.callbacks.push({ resolve, reject });

            // Process if batch is full
            if (batch.items.length >= this.batchSize) {
                this.processBatch(batchKey);
            } else if (!this.timers.has(batchKey)) {
                // Set timer for partial batch
                const timer = setTimeout(() => {
                    this.processBatch(batchKey);
                }, this.flushInterval);
                this.timers.set(batchKey, timer);
            }
        });
    }

    async processBatch(batchKey) {
        const batch = this.batches.get(batchKey);
        if (!batch || batch.items.length === 0) return;

        // Clear timer
        if (this.timers.has(batchKey)) {
            clearTimeout(this.timers.get(batchKey));
            this.timers.delete(batchKey);
        }

        try {
            let results;
            
            switch (batchKey) {
                case 'valuations':
                    results = await this.processValuationBatch(batch.items);
                    break;
                case 'searches':
                    results = await this.processSearchBatch(batch.items);
                    break;
                case 'notifications':
                    results = await this.processNotificationBatch(batch.items);
                    break;
                default:
                    results = batch.items.map(item => ({ success: true, data: item }));
            }

            // Resolve all callbacks
            batch.callbacks.forEach((callback, index) => {
                callback.resolve(results[index]);
            });

        } catch (error) {
            // Reject all callbacks
            batch.callbacks.forEach(callback => {
                callback.reject(error);
            });
        }

        // Clean up
        this.batches.delete(batchKey);
        this.emit('batchProcessed', { batchKey, itemCount: batch.items.length });
    }

    async processValuationBatch(items) {
        console.log(`Processing ${items.length} valuations...`);
        
        const results = await Promise.all(
            items.map(async (item) => {
                try {
                    // Simulate AI valuation processing
                    const valuation = {
                        tokenId: item.tokenId,
                        value: this.calculateValuation(item),
                        confidence: 0.75 + Math.random() * 0.2,
                        factors: {
                            technical: Math.random() * 40,
                            market: Math.random() * 35,
                            financial: Math.random() * 25
                        },
                        timestamp: Date.now()
                    };

                    // Cache result
                    await cache.cacheValuation(item.tokenId, valuation);
                    
                    return { success: true, data: valuation };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            })
        );

        return results;
    }

    async processSearchBatch(items) {
        console.log(`Processing ${items.length} searches...`);
        
        const results = await Promise.all(
            items.map(async (item) => {
                try {
                    // Simulate semantic search processing
                    const searchResults = this.performSemanticSearch(item.query);
                    
                    // Cache results
                    await cache.cacheSearchResults(item.query, searchResults);
                    
                    return { success: true, data: searchResults };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            })
        );

        return results;
    }

    async processNotificationBatch(items) {
        console.log(`Processing ${items.length} notifications...`);
        
        // Group by notification type
        const grouped = items.reduce((acc, item) => {
            if (!acc[item.type]) acc[item.type] = [];
            acc[item.type].push(item);
            return acc;
        }, {});

        const results = [];
        
        for (const [type, notifications] of Object.entries(grouped)) {
            try {
                await this.sendBulkNotifications(type, notifications);
                notifications.forEach(() => results.push({ success: true }));
            } catch (error) {
                notifications.forEach(() => results.push({ success: false, error: error.message }));
            }
        }

        return results;
    }

    calculateValuation(item) {
        // Simplified valuation calculation
        const baseValue = 50000;
        const multiplier = 1 + (Math.random() * 10);
        return Math.floor(baseValue * multiplier);
    }

    performSemanticSearch(query) {
        // Simplified search results
        return Array.from({ length: 5 }, (_, i) => ({
            id: `result_${i}`,
            title: `IP Result ${i} for "${query}"`,
            relevance: Math.random(),
            type: ['Patent', 'Trademark', 'Copyright'][Math.floor(Math.random() * 3)]
        }));
    }

    async sendBulkNotifications(type, notifications) {
        // Simulate bulk notification sending
        console.log(`Sending ${notifications.length} ${type} notifications`);
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    processExpiredBatches() {
        const now = Date.now();
        
        for (const [batchKey, batch] of this.batches) {
            if (now - batch.createdAt > this.maxWaitTime) {
                this.processBatch(batchKey);
            }
        }
    }

    getStats() {
        return {
            activeBatches: this.batches.size,
            activeTimers: this.timers.size,
            batches: Array.from(this.batches.entries()).map(([key, batch]) => ({
                key,
                itemCount: batch.items.length,
                age: Date.now() - batch.createdAt
            }))
        };
    }
}

module.exports = BatchProcessor;