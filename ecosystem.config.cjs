// Production-запуск через PM2: pm2 start ecosystem.config.cjs
// Снаружи доступен через Cloudflare Tunnel (atc-platform.uz → localhost:3005),
// конфиг туннеля: %USERPROFILE%\.cloudflared\atc-platform.yml
module.exports = {
    apps: [
        {
            name: 'atc-platform',
            cwd: __dirname,
            script: './.output/server/index.mjs',
            // Nitro в production сам .env не читает — подгружаем его средствами Node
            node_args: '--env-file=.env',
            // На Windows cluster-режим PM2 работает нестабильно; один процесс в fork-режиме
            exec_mode: 'fork',
            instances: 1,
            env: {
                NODE_ENV: 'production',
                PORT: 3005, // 3000 занят другим проектом, 3001 — nuxt dev
                HOST: '0.0.0.0' // локальная сеть: http://<IP-компьютера>:3005; интернет — через туннель
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true,
            // Генерация PDF сертификата с крупным фоном занимает ~1.3 ГБ:
            // при лимите 1G PM2 убивал процесс посреди выдачи сертификата
            max_memory_restart: '3G',
            autorestart: true,
            watch: false
        }
    ]
};
