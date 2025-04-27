FROM node:20-slim

# ① proposed-updates 레포 추가 (Chromium 패키지 의존성 해결)
RUN printf "deb http://deb.debian.org/debian bookworm-proposed-updates main\n" \
    > /etc/apt/sources.list.d/bookworm-proposed-updates.list

# ② 패키지 색인 갱신, 필수 라이브러리 + Chromium 설치
RUN apt-get update \
 && apt-get dist-upgrade -y \
 && apt-get install -y \
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

# Puppeteer가 이 경로를 쓰도록 환경 변수 설정
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 8080
CMD ["npm", "start"]
