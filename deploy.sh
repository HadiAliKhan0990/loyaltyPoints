#!/bin/bash
# Deployment Script for Loyalty Points System
# Deploys to EC2 on PORT 3005

EC2_HOST="ec2-3-96-139-52.ca-central-1.compute.amazonaws.com"
KEY_FILE="E:\aws-services-stage.pem"
APP_DIR="/home/ubuntu/loyalty-points-system"

echo ""
echo "🚀 Deploying Loyalty Points System..."
echo "====================================="
echo ""

# Step 1: Upload files
echo "1️⃣ Uploading files to server..."

# Create directory on server
ssh -i "$KEY_FILE" ubuntu@$EC2_HOST "mkdir -p $APP_DIR"

# Upload files
scp -i "$KEY_FILE" package.json package-lock.json Dockerfile docker-compose.yml .dockerignore index.js "ubuntu@${EC2_HOST}:${APP_DIR}/"

# Upload directories
scp -i "$KEY_FILE" -r controllers models routes middlewares config utils connection "ubuntu@${EC2_HOST}:${APP_DIR}/"

# Upload .env if it exists
if [ -f ".env" ]; then
    scp -i "$KEY_FILE" .env "ubuntu@${EC2_HOST}:${APP_DIR}/"
else
    echo "   ⚠️  .env file not found locally"
fi

# Step 2: Deploy on server
echo ""
echo "2️⃣ Building and starting container..."
ssh -i "$KEY_FILE" ubuntu@$EC2_HOST "cd $APP_DIR; docker-compose down; docker-compose build; docker-compose up -d"

# Step 3: Wait and verify
echo ""
echo "3️⃣ Waiting for container to start..."
sleep 5

echo ""
echo "4️⃣ Verifying deployment..."
ssh -i "$KEY_FILE" ubuntu@$EC2_HOST "cd $APP_DIR; docker ps | grep loyalty-points-system; echo ''; docker logs --tail 10 loyalty-points-system; echo ''; curl -s http://localhost:3005/health || echo 'Health check failed'"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Service URLs:"
echo "   Health Check: http://$EC2_HOST:3005/health"
echo "   API Base: http://$EC2_HOST:3005/api"
echo ""
