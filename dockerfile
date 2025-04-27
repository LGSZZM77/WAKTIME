FROM node:20-slim

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 종속성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 환경 변수 설정
ENV PORT=8080

# 포트 노출
EXPOSE 8080

# 앱 시작 - server/app.js 경로 사용
CMD ["node", "server/app.js"]