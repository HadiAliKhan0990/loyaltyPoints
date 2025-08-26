# PowerShell script to install node_modules on server

$EC2_HOST = "ec2-3-96-191-90.ca-central-1.compute.amazonaws.com"
$KEY_FILE = "E:\aws-services-stage.pem"
$APP_DIR = "/home/ubuntu/loyalty-points-system"

Write-Host "`n📦 Installing Node Modules on Server" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: Rebuild Docker Container (Recommended)" -ForegroundColor Yellow
Write-Host "This will install node_modules inside the container during build" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Choose option: (1) Rebuild Docker, (2) Install in container, (3) Install on server, (4) All"

if ($choice -eq "1" -or $choice -eq "4") {
    Write-Host "`n🔄 Rebuilding Docker container..." -ForegroundColor Cyan
    ssh -i $KEY_FILE ubuntu@$EC2_HOST "cd $APP_DIR; docker-compose down; docker-compose build --no-cache; docker-compose up -d"
    
    Write-Host "`n⏳ Waiting for container to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "`n✅ Verifying node_modules in container..." -ForegroundColor Cyan
    ssh -i $KEY_FILE ubuntu@$EC2_HOST "cd $APP_DIR; docker exec loyalty-points-system test -d /app/node_modules && echo 'node_modules exists' || echo 'node_modules NOT found'"
}

if ($choice -eq "2" -or $choice -eq "4") {
    Write-Host "`n📦 Installing node_modules in running container..." -ForegroundColor Cyan
    ssh -i $KEY_FILE ubuntu@$EC2_HOST "cd $APP_DIR; docker exec loyalty-points-system npm install --only=production"
}

if ($choice -eq "3" -or $choice -eq "4") {
    Write-Host "`n📦 Installing node_modules on server..." -ForegroundColor Cyan
    ssh -i $KEY_FILE ubuntu@$EC2_HOST "cd $APP_DIR; npm install --only=production"
}

Write-Host "`n✅ Done!" -ForegroundColor Green

