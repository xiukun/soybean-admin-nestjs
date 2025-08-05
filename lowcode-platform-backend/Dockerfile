# syntax=docker/dockerfile:1

ARG NODE_VERSION=20.11.1
ARG PNPM_VERSION=9.1.2

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app/lowcode-platform

# Install system dependencies
RUN apk --no-cache add curl dumb-init

# Configure npm registry for China
RUN npm config set registry https://registry.npmmirror.com/

# Install pnpm with China registry
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

################################################################################
# Create a stage for installing production dependencies.
FROM base AS deps

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.local/share/pnpm/store to speed up subsequent builds.
# Leverage bind mounts to package.json and pnpm-lock.yaml to avoid having to copy them
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=.npmrc,target=.npmrc \
    --mount=type=cache,target=/root/.local/share/pnpm/store/lowcode-platform \
    PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma/ \
    pnpm install --frozen-lockfile

################################################################################
# Create a stage for building the application.
FROM deps AS build

# Download additional development dependencies before building, as some projects require
# "devDependencies" to be installed to build. If you don't need this, remove this step.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=.npmrc,target=.npmrc \
    --mount=type=cache,target=/root/.local/share/pnpm/store/lowcode-platform \
    PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma/ \
    pnpm install --frozen-lockfile

# Copy the rest of the source files into the image.
COPY . .

# Generate Prisma client and build the application
RUN pnpm prisma:generate && pnpm build

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
# where the necessary files are copied from the build stage.
FROM base AS final

# Use production node environment by default.
ENV NODE_ENV=production

# Create application user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Create log directory and set permissions
USER root
RUN mkdir -p /usr/src/app/lowcode-platform/logs \
    /usr/src/app/lowcode-platform/generated \
    /usr/src/app/lowcode-platform/uploads && \
    chown -R nestjs:nodejs /usr/src/app/lowcode-platform

# Run the application as a non-root user.
USER nestjs

# Copy package.json so that package manager commands can be used.
COPY package.json .

# Copy the production dependencies from the deps stage and also
# the built application from the build stage into the image.
COPY --from=build --chown=nestjs:nodejs /usr/src/app/lowcode-platform/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /usr/src/app/lowcode-platform/dist ./dist
COPY --from=build --chown=nestjs:nodejs /usr/src/app/lowcode-platform/prisma ./prisma

# Copy startup script
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./
USER root
RUN chmod +x docker-entrypoint.sh && \
    chown -R nestjs:nodejs /usr/src/app/lowcode-platform
USER nestjs

# Expose the port that the application listens on.
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Run the application.
CMD ["dumb-init", "./docker-entrypoint.sh"]
