module.exports = {
  apps: [
    {
      name: "ungdoms-oppenvard",
      script: "server/index.ts",
      interpreter: "node",
      interpreter_args: "-r tsx/register",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
        DATABASE_URL:
          "postgresql://ungdoms_user:secure_password@localhost:5432/ungdoms",
        SESSION_SECRET: "your_very_long_random_session_secret_here",
        JWT_SECRET: "your_very_long_random_jwt_secret_here",
        CORS_ORIGIN: "https://your-domain.com",
        LOG_LEVEL: "info",
        ENABLE_AUDIT_LOGS: "true",
        STORAGE_PATH: "/var/lib/ungdoms-oppenvard/data",
        BACKUP_PATH: "/var/lib/ungdoms-oppenvard/backups",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=1024",
      watch: false,
      ignore_watch: ["node_modules", "logs", "*.log"],
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
  ],

  deploy: {
    production: {
      user: "deploy",
      host: "your-server.com",
      ref: "origin/main",
      repo: "git@github.com:your-username/ungdoms-oppenvard.git",
      path: "/var/www/ungdoms-oppenvard",
      "pre-deploy-local": "",
      "post-deploy":
        "npm install && npm run build && pm2 reload ecosystem.config.js --env production",
      "pre-setup": "",
    },
  },
};



