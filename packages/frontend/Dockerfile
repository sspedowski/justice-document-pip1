# Frontend Dockerfile (build context: ./frontend)
FROM node:20-alpine AS base

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build static if applicable; fallback to serve dev for this legacy frontend
RUN npm run build || true

EXPOSE 4173 8080
CMD ["npm", "run", "start"]
