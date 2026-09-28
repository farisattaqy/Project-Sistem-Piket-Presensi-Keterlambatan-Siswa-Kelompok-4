# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (termasuk prisma client generation)
RUN npm ci

# Copy seluruh source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port (default 3000)
EXPOSE 3000

# Environment variables default
ENV PORT=3000
ENV NODE_ENV=production

# Jalankan server
CMD ["node", "app.js"]
