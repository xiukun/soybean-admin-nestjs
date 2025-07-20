# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/go/dockerfile-reference/

# Want to help us make this template better? Share your feedback here: https://forms.gle/ybq9Krt8jtBL3iCk7

ARG NODE_VERSION=20.11.1
ARG PNPM_VERSION=9.1.2

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Set working directory for all build stages.
WORKDIR /usr/src/app/soybean/frontend

# Install pnpm.
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

################################################################################
# Create a stage for installing production dependecies.
FROM base AS deps

# Copy the rest of the source files into the image.
COPY . .

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.local/share/pnpm/store to speed up subsequent builds.
# Leverage bind mounts to package.json and pnpm-lock.yaml to avoid having to copy them
# into this layer.
RUN --mount=type=cache,target=/root/.local/share/pnpm/store/soybean-admin/frontend \
    pnpm install

################################################################################
# Create a stage for building the application.
FROM deps AS build

# Remove all existing env files and create clean production environment file
RUN rm -f .env .env.* && \
    echo 'VITE_BASE_URL=/' > .env.prod && \
    echo 'VITE_APP_TITLE=Soybean Admin' >> .env.prod && \
    echo 'VITE_APP_DESC=A fresh and elegant admin template' >> .env.prod && \
    echo 'VITE_ROUTER_HISTORY_MODE=history' >> .env.prod && \
    echo 'VITE_ICON_PREFIX=icon' >> .env.prod && \
    echo 'VITE_ICON_LOCAL_PREFIX=icon-local' >> .env.prod && \
    echo 'VITE_SERVICE_BASE_URL=/api' >> .env.prod && \
    echo 'VITE_SERVICE_SUCCESS_CODE=0000,200,0' >> .env.prod && \
    echo 'VITE_SERVICE_LOGOUT_CODES=1001,1002' >> .env.prod && \
    echo 'VITE_SERVICE_MODAL_LOGOUT_CODES=1003,1004' >> .env.prod && \
    echo 'VITE_SERVICE_EXPIRED_TOKEN_CODES=1005,1006' >> .env.prod && \
    echo 'VITE_AUTH_ROUTE_MODE=dynamic' >> .env.prod && \
    echo 'VITE_ROUTE_HOME=home' >> .env.prod && \
    echo 'VITE_STATIC_SUPER_ROLE=super' >> .env.prod && \
    echo 'VITE_MENU_ICON=lucide:layout-dashboard' >> .env.prod && \
    echo 'VITE_OTHER_SERVICE_BASE_URL=`{"demo": "/api", "amisService": "https://m1.apifoxmock.com/m1/3546534-2258203-default", "lowcodeService": "/lowcode-api"}`' >> .env.prod && \
    echo 'VITE_HTTP_PROXY=N' >> .env.prod && \
    echo 'VITE_SOURCE_MAP=N' >> .env.prod && \
    echo 'VITE_PROXY_LOG=N' >> .env.prod && \
    echo 'VITE_STORAGE_PREFIX=soybean' >> .env.prod && \
    echo 'VITE_AUTOMATICALLY_DETECT_UPDATE=N' >> .env.prod

# Run the build script.
RUN pnpm run build

################################################################################
# Production stage using Nginz to serve the static files
FROM nginx:stable-alpine AS final

WORKDIR /usr/share/nginx/html

RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo 'Asia/Shanghai' >/etc/timezone \
    && rm /etc/nginx/nginx.conf

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /usr/src/app/soybean/frontend/dist/ .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
