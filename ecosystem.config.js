// PM2 ecosystem configuration for HIMS App production deployment
module.exports = {
  apps: [
    {
      name: 'hims-app',
      cwd: '/home/hanmarine/projects/hims-app',
      script: '.next/standalone/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        UPLOAD_BASE_DIR: '/home/hanmarine/seafarers_files',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        UPLOAD_BASE_DIR: '/home/hanmarine/seafarers_files',
      },
      watch: false,
      max_memory_restart: '512M',
      error_file: '/home/hanmarine/projects/hims-app/logs/err.log',
      out_file: '/home/hanmarine/projects/hims-app/logs/out.log',
    },
  ],
};

