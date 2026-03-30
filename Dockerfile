# Stage 1: Dependency installation for production
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
# Install only production dependencies
# This keeps the image size lean and reduces cold-start latency
RUN npm ci --legacy-peer-deps --ignore-scripts --omit=dev --ignore-scripts

# Stage 2: Build the Vite frontend and compile the backend
FROM node:22-alpine AS builder
WORKDIR /app
# Copy package.json and lockfile for optimal layer caching
COPY package*.json ./
# Install all dependencies (including dev) to build the React frontend and compile TS
RUN npm ci --legacy-peer-deps --ignore-scripts
# Copy the rest of the application code
COPY . .
# Build the Vite frontend to the /app/dist directory
RUN npm run build
# Pre-compile the Express backend to a single JS file
RUN npx esbuild server.ts --bundle --platform=node --target=node22 --format=esm --packages=external --outfile=dist/server/index.js

# Stage 3: Production runtime (Distroless for maximum security)
FROM gcr.io/distroless/nodejs22-debian12
WORKDIR /app

# Set critical environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Copy only the necessary runtime files from the previous stages
COPY --from=prod-deps --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /app/package.json ./package.json

# Use the distroless default non-root user
USER nonroot

# Expose the Cloud Run expected port
EXPOSE 8080

# Start the application using direct Node execution
CMD ["dist/server/index.js"]
