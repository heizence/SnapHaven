# 📸 SnapHaven

**안정적인 미디어 처리 파이프라인을 갖춘 영상/사진 공유 플랫폼**

---

## About this project

**SnapHaven**은 사진 및 영상을 업로드하여 기록하고, 사용자들끼리 공유할 수 있는 미디어 중심 소셜 플랫폼입니다. 단순히 파일을 저장하는 공간을 넘어, 어떤 환경에서도 끊김 없는 미디어 경험을 제공하기 위해 설계되었습니다.

### 주요 기능

* **메인 피드 조회**: 사용자들이 업로드한 모든 피드를 불러옵니다. 피드는 단일 사진, 앨범(사진 묶음), 영상 이 3가지 종류로 구분됩니다.

* **피드 상세보기**: 각 피드 내 파일 및 상세 정보를 열람할 수 있습니다.

* **사진 & 영상 업로드**: 단일 사진, 여러 사진(앨범), 짧은 영상(1분 이내)을 업로드할 수 있습니다.

* **마이페이지**: 내 프로필, 내가 업로드한 파일 등을 조회할 수 있습니다.

**서비스 바로가기:** [https://snaphaven-app.com](https://snaphaven-app.com)

**상세 문서:** 상세 기능 목록, 프로젝트 아키텍처 설계 등 자세한 내용은 [Wiki 문서](https://github.com/heizence/SnapHaven/wiki) 에서 확인하실 수 있습니다.

## Built With

* TypeScript
* Next.js
* Nest.js
* MySQL
* TypeORM
* AWS

## Getting started

로컬 환경에서 실행하기 위한 단계별 가이드입니다.

### Prerequisites

* **Node.js:** v22.6.0 이상
* **npm:** v10.8.0 이상
* **Nginx:** v1.29.0 이상
* **Redis:** v8.2.2 이상
* **FFmpeg:** v8.0.1 이상

### Installation

1. **Repository 클론**
```bash
git clone https://github.com/heizence/SnapHaven.git
cd SnapHaven

```

2. **의존성 설치**
```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

3. **환경 변수 설정**
  
```bash
# .env.example 파일을 복사하여 .env.local 파일을 생성하고, 각 항목을 입력합니다.

cp ./server/.env.example ./server/.env.local
cp ./client/.env.example ./client/.env.local
```

4. **Redis 실행 확인**

프로젝트 실행 전 Redis 서버가 정상 작동 중이어야 합니다.

```bash
# Redis 상태 확인 (PONG 응답 시 정상)
redis-cli ping
```

### 🔐 Optional: HTTPS & Nginx Setup
Google 로그인 등 보안 기능은 HTTPS 환경에서 정상 작동합니다. 로컬 HTTPS 테스트가 필요한 경우 아래 설정을 참고하세요.

<details> <summary>Nginx & HTTPS 설정 가이드 (클릭)</summary>
<br/>
인증서 발급: mkcert 등을 이용해 로컬용 SSL 인증서를 생성합니다.

Nginx 설정: nginx/servers/snaphaven.conf 파일 생성 후 아래 프록시 설정을 추가합니다.

```bash
server {
    listen 80;
    server_name snaphaven.local.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name snaphaven.local.com;

    ssl_certificate      # SSL 인증서 path
    ssl_certificate_key  # SSL 인증서 키 path

    ssl_protocols        TLSv1.2 TLSv1.3;
    ssl_ciphers          HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://127.0.0.1:3000; # Next.js 로컬 포트
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme; # 중요: HTTPS임을 앱에 알림

    }

    location /api/v1 {
        proxy_pass http://127.0.0.1:8001; # NestJS 로컬 포트
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass_header Set-Cookie;
    }
}
```
</details>

### 프로젝트 실행

* Client
```bash
cd client
npm run start:local
```

* Server
```bash
cd server
npm run build && npm run start:local
```
