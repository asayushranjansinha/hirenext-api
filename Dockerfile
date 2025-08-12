# Stage 1: Build stage (full Node with dev dependencies)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and source files
COPY prisma ./prisma
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build app
RUN npm run build

# Stage 2: Production image (only production dependencies + built code)
FROM node:22-alpine

WORKDIR /app

# Copy only package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force


# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Expose your app port
EXPOSE 8080

# Start the app
CMD ["node", "dist/server.js"]
