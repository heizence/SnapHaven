import type { NextConfig } from "next";

const { AWS_S3_CONTENTS_BUCKET, AWS_REGION } = process.env;
const AWS_S3_CONTENTS_URL = `https://${AWS_S3_CONTENTS_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      new URL(`${AWS_S3_CONTENTS_URL}/**`),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },

  async headers() {
    return [
      {
        // API 라우트에만 이 헤더를 적용합니다.
        // source 경로를 '/api/:path*'로 설정하여 모든 API 요청에 대응합니다.
        source: "/api/:path*",
        headers: [
          // 어떤 출처를 허용할지 설정합니다.
          // '*'는 모든 출처를 의미하지만, 보안상 프로덕션 환경에서는 특정 도메인을 명시하는 것이 좋습니다.
          { key: "Access-Control-Allow-Origin", value: "*" },

          // 허용할 HTTP 메소드를 설정합니다.
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },

          // 허용할 요청 헤더를 설정합니다.
          { key: "Access-control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
