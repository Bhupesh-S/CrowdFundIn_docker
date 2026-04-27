FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
# Copy pre-installed node_modules from Jenkins workspace (avoids npm install
# inside Docker where the build daemon may have no outbound internet/DNS access)
COPY node_modules ./node_modules
# Copy source (node_modules excluded via .dockerignore so they don't overwrite above)
COPY . .
# Increase heap to prevent OOM kill on Alpine during React compilation
RUN NODE_OPTIONS=--max-old-space-size=1536 npm run build

FROM nginx:alpine

# Security: Remove default configuration and set up custom non-root configuration
RUN rm -rf /etc/nginx/conf.d/*
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
