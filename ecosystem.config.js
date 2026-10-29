module.exports = {
  apps: [
    {
      name: 'nayara-selfaccess',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/media/yuvraj/New Volume/xamp/htdocs/selfaccessdashboard',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
