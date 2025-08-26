# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose port 3005
EXPOSE 3005

# Set environment variable for port
ENV PORT=3005

# Start the application
CMD ["node", "index.js"]
