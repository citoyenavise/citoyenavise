FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .

# Inject API URL for production build
ARG VITE_API_URL=https://citoyenavise-backend-1.onrender.com/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Remove dev dependencies for production
RUN npm prune --production

EXPOSE 10000
ENV HOST=0.0.0.0 PORT=10000

CMD ["node", "server.js"]
