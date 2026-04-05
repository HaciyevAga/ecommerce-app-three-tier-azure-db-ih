# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies (including devDeps for TypeScript)
RUN npm ci

COPY . .

# Compile TypeScript to dist/
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy healthcheck script
COPY healthcheck.js ./

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]
