# Node.js 이미지를 기반으로 빌드
FROM node:20-slim

# 라이브러리 설치.
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
    chromium-browser \
    && rm -rf /var/lib/apt/lists/*

# 애플리케이션 코드 복사 및 설치
WORKDIR /app
COPY . .
RUN npm install

# 포트 설정
EXPOSE 8080

# 애플리케이션 시작 명령어
CMD ["npm", "start"]
