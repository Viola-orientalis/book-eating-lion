# --- 1단계: 빌드 ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# 배포 시 백엔드 주소를 build-arg로 주입 (docker build --build-arg VITE_API_BASE_URL=http://<EC2_IP>:8080)
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# --- 2단계: Nginx로 정적 파일 서빙 ---
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
