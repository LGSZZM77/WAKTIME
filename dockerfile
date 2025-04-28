FROM node:20-slim

# Node.js의 설치 디렉토리와 작업 디렉토리 설정
WORKDIR /app

# 의존성 파일을 먼저 복사하고 설치
COPY package*.json ./
RUN npm install

# 소스코드 복사
COPY . .

# Chromium 관련 패키지 설치
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer 설정
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# 포트 설정
EXPOSE 8080

# 애플리케이션 실행
CMD ["npm", "start"]