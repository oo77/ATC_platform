module.exports = {
    apps: [
        {
            name: 'atc-platform',
            port: 3000,
            exec_mode: 'cluster',
            instances: 'max', // или конкретное число, например 2
            script: './.output/server/index.mjs',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                HOST: '0.0.0.0'
            },
            error_file: './logs/err.log',
            out_file: './logs/out.log',
            log_file: './logs/combined.log',
            time: true,
            max_memory_restart: '1G',
            autorestart: true,
            watch: false
        }
    ]
};
