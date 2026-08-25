# ==============================================================================
# Stage 1: Build TypeScript Backend
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable PNPM v9 package manager
RUN npm install -g pnpm@9

# Copy package descriptors
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (including devDependencies for tsc)
RUN pnpm install

# Copy source code and TypeScript config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript in /app/dist
RUN pnpm build

# Prune devDependencies to keep image lean
RUN pnpm prune --prod

# ==============================================================================
# Stage 2: Production Runtime
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy node_modules and built JavaScript
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Use non-root node user for security
USER node

# Expose backend REST and WebSocket port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start production server
CMD ["node", "dist/server.js"]
