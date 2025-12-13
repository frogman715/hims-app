module.exports = {
  apps: [
    {
      name: "hims-app",
      script: "node",
      args: ".next/standalone/server.js",
      cwd: "/var/www/hims-app",
      env_file: ".env",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
