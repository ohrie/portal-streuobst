# Build stage - runs on native host platform to avoid QEMU emulation issues
FROM --platform=$BUILDPLATFORM node:24-alpine AS builder

WORKDIR /app

# Build arguments
ARG NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
ENV NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=${NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
ARG NEXT_PUBLIC_TILE_SERVER_URL
ENV NEXT_PUBLIC_TILE_SERVER_URL=${NEXT_PUBLIC_TILE_SERVER_URL}
ARG GIT_SHA
ENV GIT_SHA=${GIT_SHA}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the static export
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static files from build stage
COPY --from=builder /app/out /usr/share/nginx/html

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
