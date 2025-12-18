const path = require("path");

const projectRoot = process.env.HIMS_PM2_CWD || "/var/www/hims-app";
const envFile = process.env.HIMS_PM2_ENV_FILE || path.join(projectRoot, ".env");

module.exports = {
  apps: [
    {
      name: "hims-app",
      script: "node",
      args: ".next/standalone/server.js",
      cwd: projectRoot,
      env_file: envFile,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
