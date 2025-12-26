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
      script: "npm",
      args: "start",
      cwd: projectRoot,
      env_file: envFile,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        ...(NEXT_SERVER_ACTIONS_ENCRYPTION_KEY
          ? { NEXT_SERVER_ACTIONS_ENCRYPTION_KEY }
          : {}),
      },
    },
  ],
};
