FROM node:18-alpine
WORKDIR /app
# Copy pre-installed node_modules from Jenkins workspace (avoids npm install
# inside Docker where the build daemon may have no outbound internet/DNS access)
COPY node_modules ./node_modules
COPY . .

# Fix permission for uploads directory
RUN mkdir -p uploads && chown -R node:node /app

# Security: use non-root user
USER node

EXPOSE 5000
CMD ["node", "server.js"]
