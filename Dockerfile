# Stage 1: Build static assets
FROM node:20-alpine AS build

WORKDIR /app

# Copy package configuration files
COPY package.json package-lock.json* ./

# Use npm ci for clean, reproducible installs (includes devDependencies by default)
# --include=dev ensures TypeScript, Vite and other build tools are present
RUN npm ci --include=dev

# Copy source code and build
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-https://edify-hub-2.onrender.com}
RUN npm run build

# Stage 2: Serve assets with Nginx
FROM nginx:stable-alpine

# Copy compiled assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx server configuration template
COPY nginx.conf /etc/nginx/templates/default.conf.template

ENV BACKEND_HOST=https://edify-hub-2.onrender.com
ENV NGINX_ENVSUBST_FILTER="BACKEND_HOST"

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
