# DreamShepherd Service - Local Development
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install

# Expose port
EXPOSE 3001

# Development command with nodemon for hot reload
CMD ["npm", "run", "dev"]
