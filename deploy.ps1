# Deployment Script for Loyalty Points System
# Deploys to EC2 on PORT 3005

$EC2_HOST = "ec2-3-96-139-52.ca-central-1.compute.amazonaws.com"
$KEY_FILE = "E:\aws-services-stage.pem"
$APP_DIR = "/home/ubuntu/loyalty-points-system"

Write-Host "`n🚀 Deploying Loyalty Points System..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload files (excluding node_modules)
Write-Host "1️⃣ Uploading files to server..." -ForegroundColor Yellow

# Create directory on server
ssh -i $KEY_FILE ubuntu@$EC2_HOST "mkdir -p $APP_DIR"

# Upload files and directories (node_modules excluded via .dockerignore)
$filesToUpload = @(
    "package.json",
    "package-lock.json",
    "Dockerfile",
    "docker-compose.yml",
    ".dockerignore",
    "index.js"
)

foreach ($file in $filesToUpload) {
    if (Test-Path $file) {
        Write-Host "   Uploading $file..." -ForegroundColor Gray
        scp -i $KEY_FILE $file "ubuntu@${EC2_HOST}:${APP_DIR}/" 2>&1 | Out-Null
    }
}

# Upload directories
$dirsToUpload = @(
    "controllers",
    "models",
    "routes",
    "middlewares",
    "config",
    "utils",
    "connection"
)

foreach ($dir in $dirsToUpload) {
    if (Test-Path $dir) {
        Write-Host "   Uploading $dir/..." -ForegroundColor Gray
        scp -i $KEY_FILE -r $dir "ubuntu@${EC2_HOST}:${APP_DIR}/" 2>&1 | Out-Null
    }
}

# Upload .env if it exists
if (Test-Path ".env") {
    Write-Host "   Uploading .env file..." -ForegroundColor Gray
    scp -i $KEY_FILE .env "ubuntu@${EC2_HOST}:${APP_DIR}/" 2>&1 | Out-Null
} else {
    Write-Host "   ⚠️  .env file not found locally" -ForegroundColor Yellow
}

# Step 2: Deploy on server
Write-Host "`n2️⃣ Building and starting container..." -ForegroundColor Yellow
ssh -i $KEY_FILE ubuntu@$EC2_HOST "cd $APP_DIR; docker-compose down; docker-compose build; docker-compose up -d"

# Step 3: Wait and verify
Write-Host "`n3️⃣ Waiting for container to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n4️⃣ Verifying deployment..." -ForegroundColor Cyan
$verifyScript = @"
#!/bin/bash
cd $APP_DIR
echo "Container Status:"
docker ps | grep loyalty-points-system || echo "Container not running"

echo ""
echo "Checking logs (last 10 lines):"
docker logs --tail 10 loyalty-points-system 2>&1

echo ""
echo "Health check:"
curl -s http://localhost:3005/health || echo "Health check failed"
"@

$verifyScript | ssh -i $KEY_FILE ubuntu@$EC2_HOST "cat > /tmp/verify.sh && chmod +x /tmp/verify.sh && bash /tmp/verify.sh"

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "`n🌐 Service URLs:" -ForegroundColor Cyan
Write-Host "   Health Check: http://$EC2_HOST:3005/health" -ForegroundColor White
Write-Host "   API Base: http://$EC2_HOST:3005/api" -ForegroundColor White
Write-Host ""
