#!/bin/bash

# =================================================================
# [SnapHaven] 서비스 관리 및 배포 자동화 스크립트
# =================================================================
# 사용법: ./manage.sh [ACTION] [ENV]
# 예시: ./manage.sh start dev
# -----------------------------------------------------------------

# 1. 인자값 추출 및 기본 설정
ACTION=$1  # 실행 동작 (start, stop, restart, reload, logs, status, cleanup)
ENV=$2     # 실행 환경 (dev, prod)

# 환경값이 비어있을 경우 기본값 'dev' 설정
if [ -z "$ENV" ]; then
    ENV="dev"
fi

# 프로젝트 및 프로세스 변수 설정
PROJECT_ROOT="/home/ubuntu/SnapHaven"
SERVER_NAME="snap-server-$ENV" # 예: snap-server-dev
CLIENT_NAME="snap-client-$ENV" # 예: snap-client-dev

# =================================================================
# 헬프 기능: 가용한 모든 명령어 출력
# =================================================================
display_help() {
    echo "------------------------------------------------------------"
    echo "  SnapHaven Management Script (Native Stack)"
    echo "------------------------------------------------------------"
    echo "  Usage: $0 {action} {environment}"
    echo ""
    echo "  [Actions]"
    echo "    start    : 서비스를 처음으로 시작합니다. (pm2 start)"
    echo "    stop     : 실행 중인 서비스를 중지합니다. (pm2 stop)"
    echo "    restart  : 서비스를 완전히 죽였다가 다시 켭니다. (재설정 시 권장)"
    echo "    reload   : [추천] 중단 없이 서비스를 재시작합니다. (운영 환경 권장)"
    echo "    logs     : 서비스의 실시간 로그를 확인합니다."
    echo "    status   : 현재 프로세스의 상태를 확인합니다."
    echo "    cleanup  : 빌드 잔여물 및 로그를 정리합니다."
    echo ""
    echo "  [Environments]"
    echo "    dev      : 개발용 EC2 환경 (기본값)"
    echo "    prod     : 실제 운영 환경"
    echo "------------------------------------------------------------"
}

# =================================================================
# 각 액션별 실행 로직
# =================================================================
case "$ACTION" in
    # -------------------------------------------------------------
    # START / RESTART: 프로세스를 완전히 새로 시작
    # -------------------------------------------------------------
    start | restart)
        echo "♻️ [$ENV] 서비스를 시작/재시작합니다..."
        
        # [Server] 프로세스 관리
        pm2 delete $SERVER_NAME 2>/dev/null || true
        cd "$PROJECT_ROOT/server"
        NODE_ENV=$ENV pm2 start dist/main.js --name "$SERVER_NAME" --env $ENV -i 1

        # [Client] 프로세스 관리
        pm2 delete $CLIENT_NAME 2>/dev/null || true
        cd "$PROJECT_ROOT/client"
        NODE_ENV=$ENV pm2 start npm --name "$CLIENT_NAME" -- start
        
        pm2 save
        ;;

    # -------------------------------------------------------------
    # RELOAD: 무중단 재시작 (Zero-downtime)
    # -------------------------------------------------------------
    reload)
        echo "🔄 [$ENV] 무중단 배포(Reload)를 수행합니다..."
        # reload는 기존 프로세스를 살려둔 상태에서 순차적으로 교체합니다.
        pm2 reload $SERVER_NAME
        pm2 reload $CLIENT_NAME
        ;;

    # -------------------------------------------------------------
    # STOP: 서비스 완전 정지
    # -------------------------------------------------------------
    stop)
        echo "🛑 [$ENV] 서비스를 정지합니다..."
        pm2 stop $SERVER_NAME
        pm2 stop $CLIENT_NAME
        ;;

    # -------------------------------------------------------------
    # LOGS: 실시간 로그 스트리밍
    # -------------------------------------------------------------
    logs)
        echo "📋 [$ENV] 서버 로그를 출력합니다. (종료: Ctrl+C)"
        pm2 logs $SERVER_NAME
        ;;

    # -------------------------------------------------------------
    # STATUS: 프로세스 상태 요약
    # -------------------------------------------------------------
    status)
        echo "📊 [$ENV] 서비스 현재 상태:"
        pm2 list | grep $ENV
        ;;

    # -------------------------------------------------------------
    # CLEANUP: 시스템 최적화 및 청소
    # -------------------------------------------------------------
    cleanup)
        echo "🧹 [$ENV] 빌드 캐시 및 로그를 정리합니다..."
        pm2 flush # pm2 로그 비우기
        # 필요한 경우 빌드 폴더 정리 로직 추가
        # rm -rf $PROJECT_ROOT/server/dist
        ;;

    # -------------------------------------------------------------
    # HELP / DEFAULT
    # -------------------------------------------------------------
    help | *)
        display_help
        exit 1
        ;;
esac

echo "✅ [$ENV] $ACTION 작업이 완료되었습니다."