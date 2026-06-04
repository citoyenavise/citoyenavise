# syntax=docker/dockerfile:1

# ---------- Stage 1 : build Vite ----------
FROM node:18-alpine AS build

WORKDIR /app

# Dependencies
COPY package*.json ./
RUN npm ci

# Source + build
COPY . .

# URL API injectee au build (cible VPS Hostinger)
ARG VITE_API_URL=https://api.citoyenavise.org/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- Stage 2 : service NGINX (SPA) ----------
FROM nginx:alpine

# Config SPA (try_files -> index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Artefacts statiques
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
