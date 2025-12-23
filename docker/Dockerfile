# Stage 1: Base image with Node.js and pnpm
FROM node:20-slim AS base

# Install system dependencies for Prisma and other native modules
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Stage 2: Install dependencies
FROM base AS dependencies

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy Prisma schema (needed for generation)
COPY prisma ./prisma/

# Copy source code (needed for TSR generation in postinstall)
COPY . .

# Install all dependencies (this will run postinstall: prisma generate && tsr generate)
RUN pnpm install --no-frozen-lockfile

# Stage 3: Build the application
FROM dependencies AS build

WORKDIR /app

# Set environment variables for build (placeholder values for validation, real values at runtime)
ENV NODE_ENV=production \
    ADMIN_PASSWORD=placeholder_admin_password \
    JWT_SECRET=placeholder_jwt_secret_min_32_chars_long \
    OPENROUTER_API_KEY=placeholder_openrouter_api_key

# Build the application (source and dependencies already present from dependencies stage)
RUN pnpm build

# Stage 4: Production runtime
FROM base AS production

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install only production dependencies (skip postinstall to avoid dev dependency issues)
RUN pnpm install --no-frozen-lockfile --prod --ignore-scripts

# Copy built application from build stage (.output contains everything including bundled Prisma client)
COPY --from=build /app/.output /app/.output

# Copy public assets
COPY --from=build /app/public /app/public

# Expose the application port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Run the application
CMD ["pnpm", "start"]
