FROM node:20.11-slim AS builder

WORKDIR /app

# Copy package manifests and install deps
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

FROM node:20.11-slim

WORKDIR /home/node/app

# Create non-root user and set ownership
RUN mkdir -p /home/node/app \
    && chown -R node:node /home/node/app

# Copy package files and install production dependencies
COPY --chown=node:node package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/src/config ./dist/config
COPY --chown=node:node --from=builder /app/src/database/migrations ./dist/database/migrations

# Install required system packages
USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    postgresql-client \
    netcat-traditional && \
    rm -rf /var/lib/apt/lists/*
USER node

# Expose application port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3003/health || exit 1

# Start script
COPY --chown=node:node scripts/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Start the application
CMD ["./docker-entrypoint.sh"]