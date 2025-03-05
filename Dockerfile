FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install
RUN npm i --save-dev @types/mime-types

# Copy the rest of the application
COPY . .

RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Build the Next.js application
RUN npm run build

# Start the application
CMD ["npm", "start"]