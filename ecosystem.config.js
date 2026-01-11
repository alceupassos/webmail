module.exports = {
    apps: [
        {
            name: 'cepalab-webmail',
            script: 'node_modules/.bin/next',
            args: 'start -p 7000',
            cwd: '/home/cepalab/webmail',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 7000,
            },
        },
    ],
};
