const path = require('path');

const root = __dirname;

module.exports = {
  apps: [
    {
      name: 'ssor-backend',
      cwd: path.join(root, 'backend'),
      script: 'src/server.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ssor-frontend',
      cwd: path.join(root, 'frontend'),
      script: 'npm',
      args: 'run serve:prod',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
