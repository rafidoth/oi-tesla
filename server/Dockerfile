# ==============================================================================
# Stage 1: Build TypeScript source code
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies required for compilation)
RUN npm install

# Copy source code and configuration files
COPY . .

# Compile TypeScript to JavaScript (emits to dist/)
RUN npx tsc

# ==============================================================================
# Stage 2: Production runtime environment
# ==============================================================================
FROM node:20-alpine AS runner

# Container metadata labels
LABEL org.opencontainers.image.title="OiTesla Server" \
      org.opencontainers.image.description="OiTesla Express Backend Service" \
      org.opencontainers.image.authors="OiTesla Team"

WORKDIR /app

ENV NODE_ENV=production

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder --chown=node:node /app/dist ./dist

# Run as non-root user for security
USER node

# Expose HTTP port
EXPOSE 8080

# Start production server
CMD ["node", "dist/server.js"]
