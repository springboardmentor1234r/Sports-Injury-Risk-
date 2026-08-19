# Stage 1: build the React app into static files
FROM node:20-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Vite bakes environment variables into the build at BUILD time, not
# runtime -- unlike the backend, you can't just change this with an
# environment variable when starting the container later. It has to be
# passed in here, as a build argument.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: serve the built static files with nginx -- the final image
# contains no Node.js at all, just the compiled output and a tiny web
# server, which is both smaller and more secure than shipping the build
# toolchain into production.
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
