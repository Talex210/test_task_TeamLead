# ===============================================
# Multi-stage build for Jira Project Assistant
# ===============================================

# Stage 1: Build the UI application - используем стандартный Node.js вместо Alpine
FROM node:18 AS build

# Set working directory for UI
WORKDIR /app/static/ui

# Copy UI package files first
COPY static/ui/package*.json ./

# Устанавливаем зависимости включая devDependencies (нужны для сборки)
RUN npm install

# Copy UI source code
COPY static/ui/ ./

# Build the application with Vite
RUN npm run build

# Stage 2: Production server с Nginx на Alpine
FROM nginx:1.25-alpine AS production

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy built application
COPY --from=build /app/static/ui/build /usr/share/nginx/html

# Copy nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
