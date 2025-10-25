FROM nginx:alpine

# Remove default configuration
RUN rm /etc/nginx/conf.d/default.conf || true

# Copy custom configuration and landing assets
COPY nginx.conf /etc/nginx/nginx.conf
COPY html/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
