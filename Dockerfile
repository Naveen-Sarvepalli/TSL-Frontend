# ---------- Stage 1: Build React App ----------
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./

# Dynamic stream allocator: populates fd 0, 1, or 2 only if the runner left them closed
RUN touch /tmp/fd_fix && \
    { true <&0 2>/dev/null || exec 0</tmp/fd_fix; } && \
    { true >&1 2>/dev/null || exec 1>/tmp/fd_fix; } && \
    { true >&2 2>/dev/null || exec 2>/tmp/fd_fix; } && \
    npm ci

# Copy only source needed for production build
COPY src ./src
COPY index.html .
COPY public ./public
COPY tailwind.config.ts .
COPY vite.config.ts .
COPY tsconfig*.json .

# Apply the same stream shield to the production compilation layer
RUN touch /tmp/fd_fix && \
    { true <&0 2>/dev/null || exec 0</tmp/fd_fix; } && \
    { true >&1 2>/dev/null || exec 1>/tmp/fd_fix; } && \
    { true >&2 2>/dev/null || exec 2>/tmp/fd_fix; } && \
    npm run build

# ---------- Stage 2: Serve with NGINX ----------
FROM nginx:stable-alpine
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
