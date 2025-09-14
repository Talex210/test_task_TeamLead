# Stage 1: Build the UI application
FROM node:18 AS build

# Set working directory for UI
WORKDIR /app/static/ui

# Copy UI package files first
COPY static/ui/package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy UI source code
COPY static/ui/ ./

# Build arguments - по умолчанию dev режим для Docker
ARG VITE_DEV_MODE=true
ARG NODE_ENV=production

# Устанавливаем переменные окружения
ENV VITE_DEV_MODE=${VITE_DEV_MODE}
ENV NODE_ENV=${NODE_ENV}

# Показываем что у нас в переменных
RUN echo "Building with VITE_DEV_MODE=${VITE_DEV_MODE} NODE_ENV=${NODE_ENV}"

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

# Stage 3: Development stage
FROM node:18 AS development

WORKDIR /app/static/ui

# Copy package files
COPY static/ui/package*.json ./

# Install all dependencies for development
RUN npm install

# Copy source files
COPY static/ui/ ./

# Set dev mode explicitly
ENV VITE_DEV_MODE=true
ENV NODE_ENV=development

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
