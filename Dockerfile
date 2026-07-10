# ---------- Stage 1: Build React App ----------
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Copy only source needed for production build
COPY src ./src
COPY index.html .
COPY public ./public
COPY tailwind.config.ts .
COPY vite.config.ts .
COPY tsconfig*.json .

# Apply the same stream shield to the production compilation layer
RUN npm run build

# ---------- Stage 2: Serve with NGINX ----------
FROM nginx:stable-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
