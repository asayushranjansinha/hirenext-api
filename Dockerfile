# Use Node Alpine for small image
FROM node:22-alpine

WORKDIR /app

# Copy package files & install deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy prisma schema & source code
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json ./

# Generate Prisma client with correct env
RUN npx prisma generate

# Build app (typescript)
RUN npm run build

EXPOSE 8080

# Run migrations and start server on container start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
