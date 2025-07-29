FROM node:18-alpine

WORKDIR /app

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies (use npm install if no lock file, otherwise npm ci)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy frontend source code
COPY frontend/ .

# Build the app
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app using serve from node_modules
CMD ["npx", "serve", "-s", "build", "-l", "3000"]
