#!/bin/bash

# PBL6 Frontend Deployment Script for EC2
# This script automates the deployment process

echo "🚀 Starting PBL6 Frontend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Pull latest code (if using git)
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main || echo "Not a git repository or pull failed, continuing..."

# Step 2: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

# Step 3: Build the application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Please check the errors above.${NC}"
    exit 1
fi

# Step 4: Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚙️  PM2 not found. Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Step 5: Stop existing PM2 process if running
echo -e "${YELLOW}🛑 Stopping existing application...${NC}"
pm2 stop pbl6-fe 2>/dev/null || echo "No existing process to stop"

# Step 6: Start the application with PM2
echo -e "${YELLOW}▶️  Starting application with PM2...${NC}"
pm2 start ecosystem.config.js

# Step 7: Save PM2 process list
echo -e "${YELLOW}💾 Saving PM2 process list...${NC}"
pm2 save

# Step 8: Setup PM2 startup script (first time only)
echo -e "${YELLOW}🔧 Setting up PM2 startup script...${NC}"
pm2 startup | tail -n 1 | sudo bash || echo "Startup script already configured"

# Step 9: Show status
echo -e "${GREEN}✅ Deployment completed!${NC}"
echo ""
echo -e "${GREEN}📊 Application Status:${NC}"
pm2 status

echo ""
echo -e "${GREEN}🌐 Your application should be accessible at:${NC}"
echo -e "${GREEN}   http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3001${NC}"
echo ""
echo -e "${YELLOW}📝 Useful commands:${NC}"
echo "   pm2 logs pbl6-fe    - View logs"
echo "   pm2 restart pbl6-fe - Restart application"
echo "   pm2 stop pbl6-fe    - Stop application"
echo "   pm2 monit           - Monitor application"
