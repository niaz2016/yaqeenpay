# syntax=docker/dockerfile:1.4
# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies using BuildKit cache mount for npm cache and use npm ci for reproducible installs.
# Keep --legacy-peer-deps here since the repo currently needs it; once deps are fixed you can drop it.
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
	npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Allow overriding the base path when building the production bundle (default /escrow-market/)
# Frontend needs full path since browser resolves absolute paths from domain root
ARG VITE_BASE_PATH=/escrow-market/
ARG VITE_API_URL=/api

# Set as ENV so Vite can access them during build
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]