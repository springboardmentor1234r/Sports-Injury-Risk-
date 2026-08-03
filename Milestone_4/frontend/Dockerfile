# Sports Injury Risk Detection Platform — frontend
# Milestone 4: Docker containerization (PDF section 13)

# --- Stage 1: build the Vite/React app ---
FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_API_BASE is baked into the static build at build time (Vite env
# vars are compile-time, not runtime) — pass it via docker-compose's
# build.args, e.g. --build-arg VITE_API_BASE=https://api.yourdomain.com
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build

# --- Stage 2: serve the static build with nginx ---
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
