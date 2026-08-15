# ============================================================
# MoveIQ Frontend Dockerfile
# Next.js 16 — 3-stage build for minimal production image
# ============================================================

# ---- Stage 1: deps ----
# Install all node_modules
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first (Docker layer cache optimization)
COPY package.json package-lock.json* ./

# Install dependencies (npm install is more forgiving than npm ci)
RUN npm install --legacy-peer-deps



# ---- Stage 2: builder ----
# Build the Next.js production bundle
FROM node:20-alpine AS builder

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all frontend source code
COPY . .

# Build the production Next.js app (output: standalone mode)
RUN npm run build


# ---- Stage 3: runner ----
# Minimal final image — only the compiled output, no node_modules
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone Next.js server bundle (no node_modules needed)
COPY --from=builder /app/.next/standalone ./

# Copy static assets (images, fonts, etc.)
COPY --from=builder /app/.next/static ./.next/static

# Copy public folder (favicon, robots.txt, etc.)
COPY --from=builder /app/public ./public

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the self-contained Next.js server
CMD ["node", "server.js"]
