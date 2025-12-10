module.exports = {
  apps: [
    {
      name: "hims-app",
      script: "node",
      args: ".next/standalone/server.js",
      cwd: "/var/www/hims-app",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
