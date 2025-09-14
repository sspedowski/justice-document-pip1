# Justice Server Dockerfile (context: this folder)
FROM node:20-alpine AS base

# Optional: tzdata for consistent logs
RUN apk add --no-cache tzdata

WORKDIR /app

# Install production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
