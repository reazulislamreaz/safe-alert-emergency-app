# ==============================================================================
# Stage 1: Build React/Vite Frontend
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Enable PNPM v9 package manager
RUN npm install -g pnpm@9

# Copy package descriptors
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including Vite & Tailwind)
RUN pnpm install

# Copy source files & build configs
COPY tsconfig.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src ./src

# Build production SPA assets to /app/dist
RUN pnpm build

# ==============================================================================
# Stage 2: Production Nginx Server
# ==============================================================================
FROM nginx:1.27-alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose web server port
EXPOSE 80

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
