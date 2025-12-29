module.exports = {
  apps: [
    {
      name: "snaphaven-api",
      script: "./dist/main.js",
      env: {
        NODE_ENV: "prod",
      },
    },
  ],
};
