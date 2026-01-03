#!/bin/bash

TARGET_ENV=$1

if [ "$TARGET_ENV" != "dev" ] && [ "$TARGET_ENV" != "prod" ]; then
  echo "❌ Error: usage: ./deploy.sh dev | prod"
  exit 1
fi

BRANCH=$([ "$TARGET_ENV" == "prod" ] && echo "production" || echo "develop")

echo "🚀 [$TARGET_ENV] ($BRANCH) Docker 배포를 시작합니다..."

# 1. 최신 코드 가져오기
git fetch --all
git reset --hard origin/$BRANCH
git pull origin $BRANCH

# 2. Docker Compose 실행
# --build: 이미지를 새로 빌드합니다.
# -d: 백그라운드에서 실행합니다.
export TARGET_ENV=$TARGET_ENV
docker-compose down # 기존 컨테이너 중지 및 제거
docker-compose up --build -d

# 3. 미사용 이미지 정리 (용량 확보)
docker image prune -f

echo "✅ [$TARGET_ENV] Docker 배포 완료!"
docker ps