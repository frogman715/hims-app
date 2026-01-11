const path = require("path");
const dotenv = require("dotenv");

const projectRoot = process.env.HIMS_PM2_CWD || "/var/www/hims-app";
const envFile = process.env.HIMS_PM2_ENV_FILE || path.join(projectRoot, ".env");

dotenv.config({ path: envFile });

const NEXT_SERVER_ACTIONS_ENCRYPTION_KEY = process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY;

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
        // Upload configuration
        UPLOAD_BASE_DIR: process.env.UPLOAD_BASE_DIR || "/home/hanmarine/seafarers_files",
        UPLOAD_MAX_SIZE_MB: process.env.UPLOAD_MAX_SIZE_MB || "20",
        ...(NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
          ? { NEXT_SERVER_ACTIONS_ENCRYPTION_KEY }
          : {}),
      },
    },
  ],
};
