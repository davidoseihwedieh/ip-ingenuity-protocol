FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY security/package*.json ./security/

# Install dependencies
RUN npm ci --only=production
RUN cd security && npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]