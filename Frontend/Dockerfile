# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (need devDependencies for TypeScript build)
# Using 'npm install --legacy-peer-deps' to tolerate older packages that have not yet declared React 19 support.
# After aligning peer dependency ranges you can revert to 'npm ci' for reproducible installs.
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Allow overriding the base path when building the production bundle (default /yaqeenpay)
ARG VITE_BASE_PATH=/yaqeenpay
ENV VITE_BASE_PATH=${VITE_BASE_PATH}

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