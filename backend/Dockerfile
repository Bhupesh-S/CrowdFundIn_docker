FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Fix permission for uploads directory
RUN mkdir -p uploads && chown -R node:node /app

# Security: use non-root user
USER node

EXPOSE 5000
CMD ["node", "server.js"]
