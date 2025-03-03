FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependenciesi
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the Next.js application
RUN npm run build

# Start the application
CMD ["npm", "start"]