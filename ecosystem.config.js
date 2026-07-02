module.exports = {
  apps: [
    {
      name: 'bhakti-management-backend',
      script: 'dist/index.js',
      instances: 1, // Single instance for low resource utilization
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        JWT_SECRET: 'BhaktiConsultancySuperSecureSecretJWTKey98765',
        // Make sure to define the production DATABASE_URL env var on your server
      },
    },
  ],
};
