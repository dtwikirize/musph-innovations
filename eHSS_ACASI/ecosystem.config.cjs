module.exports = {
  apps: [
    {
      name: "ehss-acasi",
      script: "backend/src/server.js",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000
      }
    }
  ]
};
