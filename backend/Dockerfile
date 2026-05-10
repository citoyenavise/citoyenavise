FROM node:18-alpine

WORKDIR /app

# Copier package files
COPY package*.json ./

# Installer dépendances
RUN npm ci --only=production && npm ci --only=development

# Copier code source
COPY . .

# Exposer port
EXPOSE 3000

# Commande par défaut (peut être override par docker-compose)
CMD ["npm", "start"]
