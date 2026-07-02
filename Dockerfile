# ==========================================
# Stage 1: Build the React client
# ==========================================
FROM node:24-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Build the TypeScript backend
# ==========================================
FROM node:24-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src/ ./src
COPY prisma/ ./prisma
RUN npx prisma generate
RUN npm run build

# ==========================================
# Stage 3: Runner container (Production)
# ==========================================
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package configurations and install production dependencies
COPY package*.json ./
RUN npm install --only=production

# Install Prisma CLI globally or locally to run db push/migration on startup
RUN npm install prisma -g

# Copy compiled backend files
COPY --from=backend-builder /app/dist ./dist
# Copy prisma configuration and schema
COPY --from=backend-builder /app/prisma ./prisma

# Copy built frontend assets
COPY --from=client-builder /app/client/dist ./client/dist

# Expose port and configure persistent volumes
EXPOSE 5000
VOLUME [ "/app/uploads" ]

# Start script that runs db push to sync schema and starts the server
CMD npx prisma db push && node dist/index.js
