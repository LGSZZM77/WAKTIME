FROM node:20-slim

# 작업 디렉토리 설정
WORKDIR /app

# 크롬 의존성 설치 (Puppeteer에 필요)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    libglib2.0-0 \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libatspi2.0-0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# package.json 및 package-lock.json 복사 (캐싱을 위해)
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 환경 변수 설정
ENV PORT=8080
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome

# 포트 노출
EXPOSE 8080

# 마지막 CMD 줄을 이것으로...
CMD ["sh", "-c", "ls -la && echo 'Starting server...' && node server/app.js"]