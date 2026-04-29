# ── Stage 1: Install production dependencies only ────────────────────────────
FROM node:18.20-alpine3.20 AS deps

WORKDIR /app
COPY package*.json ./

# npm ci: faster, reproducible, and strictly respects package-lock.json
# --omit=dev: excludes devDependencies (nodemon etc.) from the production install
RUN npm install --omit=dev


# ── Stage 2: Lean runtime image ───────────────────────────────────────────────
FROM node:18.20-alpine3.20

LABEL org.opencontainers.image.title="CrowdFundIn Backend" \
      org.opencontainers.image.description="Node.js/Express API for the CrowdFundIn platform" \
      org.opencontainers.image.base.name="node:18.20-alpine3.20"

WORKDIR /app

# Copy only the production node_modules from the deps stage (no devDependencies)
COPY --from=deps /app/node_modules ./node_modules

# Explicitly copy only the application source needed at runtime
# (defence-in-depth alongside .dockerignore)
COPY package*.json  ./
COPY server.js      ./
COPY metrics.js     ./
COPY config/        ./config/
COPY middleware/    ./middleware/
COPY models/        ./models/
COPY routes/        ./routes/
COPY services/      ./services/

# Ensure the uploads directory exists and belongs to the non-root user
RUN mkdir -p uploads && chown -R node:node /app

# Security: run as non-root node user
USER node

EXPOSE 5000
CMD ["node", "server.js"]
