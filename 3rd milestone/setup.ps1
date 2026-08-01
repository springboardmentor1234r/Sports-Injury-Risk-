Write-Host "Setting up Sports Injury Risk Detection Platform..."
New-Item -ItemType Directory -Force -Path volumes\postgres, volumes\mongodb, volumes\minio, volumes\redis
Copy-Item deployment\.env.example .env
Write-Host "Setup complete. Run 'docker-compose up -d' to start services."
