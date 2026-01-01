/**
 * PM2 실행을 위한 설정 파일
 * 프론트엔드(Next.js)와 백엔드(NestJS)가 한 저장소(Repo)에 있을 때,
 * 이를 각각 따로 실행하지 않고 하나의 명령어로 동시에 켜고 끌 수 있게 해 준다.
 */
module.exports = {
  apps: [
    {
      name: "snaphaven-client", // PM2 목록에 표시될 이름
      cwd: "./client", // 명령어를 실행하기 전 이 폴더로 이동(cd)
      script: "npm", // 실행할 프로그램
      args: "run start", // script 뒤에 붙을 명령어 인자
      // --env dev 옵션을 주었을 때 주입될 변수
      env_dev: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      // --env prod 옵션을 주었을 때 주입될 변수
      env_prod: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "snaphaven-server",
      cwd: "./server",
      script: "node",
      args: "dist/main.js",
      env_dev: {
        NODE_ENV: "dev",
      },
      env_prod: {
        NODE_ENV: "prod",
      },
    },
  ],
};
