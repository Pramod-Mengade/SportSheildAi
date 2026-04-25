FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose port (Cloud Run defaults to 8080)
EXPOSE 8080

# Run the Express server
CMD ["node", "server.js"]
