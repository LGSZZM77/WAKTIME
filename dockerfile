FROM node:20-slim

# ① 패키지 갱신 및 Chromium 설치를 위한 레포지토리 추가
RUN printf "deb http://deb.debian.org/debian bookworm main\n" \
    > /etc/apt/sources.list.d/bookworm.list

# ② 패키지 갱신·업그레이드 후 chromium 설치
RUN apt-get update \
  && apt-get dist-upgrade -y \
  && apt-get install -y \
     libnss3 libatk-bridge2.0-0 libgtk-3-0 libxss1 \
     libasound2 libnspr4 fonts-liberation libappindicator3-1 \
     libu2f-udev wget chromium \
  && rm -rf /var/lib/apt/lists/*

# Puppeteer가 사용할 chromium 경로 설정
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 8080

CMD ["npm", "start"]
