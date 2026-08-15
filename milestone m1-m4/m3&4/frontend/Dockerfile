# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app
ARG VITE_API_URL=/
ENV VITE_API_URL=$VITE_API_URL

# Copy package configuration files
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve the compiled app using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build files from Stage 1 to Nginx serve directory
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
