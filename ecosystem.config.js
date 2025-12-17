// PM2 tetap membaca berkas root ini, sementara konfigurasi utama dipusatkan di deploy/config
// eslint-disable-next-line @typescript-eslint/no-require-imports
module.exports = require('./deploy/config/pm2/ecosystem.config.js');
