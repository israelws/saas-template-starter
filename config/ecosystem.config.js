module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'npm',
      args: 'run dev',
      cwd: './apps/backend',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      time: true,
      autorestart: true,
      max_restarts: 3,
      min_uptime: 5000
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './apps/admin-dashboard',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      time: true,
      autorestart: true,
      max_restarts: 3,
      min_uptime: 5000
    }
  ]
};