#!/bin/bash

TARGET_ENV=$1

# 1. 환경 인자 체크
if [ "$TARGET_ENV" != "dev" ] && [ "$TARGET_ENV" != "prod" ]; then
  echo "❌ Error: usage: ./deploy.sh dev | prod"
  exit 1
fi

BRANCH=$([ "$TARGET_ENV" = "prod" ] && echo "production" || echo "develop")

echo "🚀 [$TARGET_ENV] ($BRANCH) Docker Compose 배포를 시작합니다..."

# 2. 코드 업데이트 (필요 시 주석 해제)
# git fetch --all
# git reset --hard origin/$BRANCH
# git pull origin $BRANCH

# 3. 환경 변수 Export (Compose 파일에서 사용됨)
export TARGET_ENV=$TARGET_ENV

# 4. Docker Compose 실행
# --build: 이미지를 새로 빌드
# -d: 백그라운드 실행
# --remove-orphans: 정의되지 않은 기존 컨테이너 정리
echo "📦 Orchestrating containers..."
docker compose down
docker compose up --build -d --remove-orphans

# 5. 미사용 이미지 정리
docker image prune -f

echo "✅ [$TARGET_ENV] 모든 서비스 배포 완료!"
docker compose ps