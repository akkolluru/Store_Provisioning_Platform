# Multi-stage build for production-ready image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies (including devDependencies for building)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security (use existing node user)
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose application port
EXPOSE 3000

# Health check (will be used by Docker, Kubernetes has its own probes)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/store-service/app.js"]
