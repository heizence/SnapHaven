#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}   Snaphaven 로컬 개발 환경 시작 (Local Mode)   ${NC}"
echo -e "${BLUE}==========================================${NC}"

# 1. Docker 인프라 실행 (DB, Redis)
echo -e "${YELLOW}[1/4] Docker 인프라(DB, Redis) 실행 중...${NC}"
# NestJS가 Redis도 사용하므로 db와 함께 redis도 띄우는 것이 좋습니다.
docker compose --env-file ./server/.env.dev up -d --build db redis

# 2. Nginx 주도권 전환 (Docker Nginx 중지 -> Homebrew Nginx 시작)
echo -e "${YELLOW}[2/4] Nginx 주도권 전환 중 (Local Nginx 활성화)...${NC}"
docker compose stop nginx 2>/dev/null
sudo brew services restart nginx

# 3. 서버(NestJS) 실행 - 새 터미널 탭에서 실행
echo -e "${YELLOW}[3/4] 백엔드 서버(NestJS) 실행 중...${NC}"
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/server && npm run start:local\""

# 4. 클라이언트(Next.js) 실행 - 새 터미널 탭에서 실행
echo -e "${YELLOW}[4/4] 프론트엔드 클라이언트(Next.js) 실행 중...${NC}"
osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/client && npm run start:local\""

echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}🚀 모든 서비스가 시작되었습니다!${NC}"
echo -e "${BLUE}==========================================${NC}"