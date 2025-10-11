# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (need devDependencies for TypeScript build)
# Using 'npm install' instead of 'npm ci' because package-lock.json not yet updated with new dependency.
# After committing an updated lock file you can revert to faster, reproducible 'npm ci'.
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# (Optional) Reduce node_modules to production only for any subsequent usage in this stage
RUN npm prune --production

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