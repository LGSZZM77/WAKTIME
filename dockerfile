FROM node:20-slim

# Install necessary dependencies and Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libxss1 \
    libasound2 \
    libnspr4 \
    fonts-liberation \
    libappindicator3-1 \
    libu2f-udev \
    wget \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Set the environment variable for Puppeteer to use Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set your working directory and install dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the necessary port
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
