#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}   Snaphaven 도커 개발 환경 시작 (Docker Mode)   ${NC}"
echo -e "${BLUE}==========================================${NC}"

# 1. 로컬 서비스 종료 확인 (Nginx 충돌 방지)
echo -e "${YELLOW}[1/3] 로컬 Nginx 및 프로세스 점유 해제 중...${NC}"
sudo brew services stop nginx 2>/dev/null
# 혹시 모를 유령 Nginx 프로세스 강제 종료
sudo pkill -9 nginx 2>/dev/null

# 2. Docker Compose 실행 (전체 서비스 빌드 및 실행)
echo -e "${YELLOW}[2/3] Docker 컨테이너 빌드 및 실행 중 (전체 서비스)...${NC}"
# 사용자님이 기존에 사용하시던 명령어에 --force-recreate를 추가하여 설정을 확실히 반영합니다.
docker compose --env-file ./server/.env.dev up -d --build --force-recreate

# 3. 서비스 상태 확인
echo -e "${YELLOW}[3/3] 서비스 상태 확인 중...${NC}"
sleep 2
docker compose ps

echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}🚀 모든 Docker 컨테이너가 준비되었습니다!${NC}"
echo -e "${BLUE}==========================================${NC}"
echo -e "💡 로그를 보려면 다음 명령어를 입력하세요: ${YELLOW}docker compose logs -f${NC}"