# ===============================================
# Multi-stage build for Jira Project Assistant
# ===============================================

# Stage 1: Build the UI application
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Install global dependencies for better caching
RUN npm install -g npm@latest

# Copy root package files first (for better Docker layer caching)
COPY package*.json ./
RUN npm ci --only=production || npm install --only=production

# Set working directory for UI
WORKDIR /app/static/ui

# Copy UI package files
COPY static/ui/package*.json ./

# Install UI dependencies with production optimizations
RUN npm ci --only=production || npm install --only=production

# Copy UI source code
COPY static/ui/ ./

# Build the application with Vite
# Output directory: build/ (configured in vite.config.js)
RUN npm run build

# Verify build output
RUN ls -la build/ && echo "Build completed successfully"

# ===============================================
# Stage 2: Production server with Nginx
# ===============================================

FROM nginx:1.25-alpine AS production

# Install necessary packages
RUN apk add --no-cache \
    curl \
    tzdata

# Set timezone (optional)
ENV TZ=UTC

# Copy built application from build stage
COPY --from=build /app/static/ui/build /usr/share/nginx/html

# Create custom nginx configuration for SPA
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;

    # Root directory
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml+rss
        application/atom+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # API proxy (if needed in future)
    location /api/ {
        # Placeholder for API proxy configuration
        return 404;
    }
}
EOF

# Create nginx user and set permissions
RUN addgroup -g 101 -S nginx && \
    adduser -S -D -H -u 101 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Set ownership
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx

# Expose port
EXPOSE 80

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Add labels for documentation
LABEL maintainer="Alex_Tol" \
      version="1.0.0" \
      description="Jira Project Assistant - Production Docker Image" \
      org.opencontainers.image.title="Jira Project Assistant" \
      org.opencontainers.image.description="TypeScript React application for Jira project management" \
      org.opencontainers.image.source="https://github.com/example/jira-assistant" \
      org.opencontainers.image.vendor="Alex_Tol"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
