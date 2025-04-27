FROM node:20-slim

# ① proposed-updates 레포 추가
RUN printf "deb http://deb.debian.org/debian bookworm-proposed-updates main\n" \
    > /etc/apt/sources.list.d/bookworm-proposed-updates.list

# ② 패키지 갱신·업그레이드 후 Chromium 설치
RUN apt-get update \
  && apt-get dist-upgrade -y \
  && apt-get install -y \
     libnss3 libatk-bridge2.0-0 libgtk-3-0 libxss1 \
     libasound2 libnspr4 fonts-liberation libappindicator3-1 \
     libu2f-udev wget chromium \
  && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
