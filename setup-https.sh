#!/bin/bash

# Setup HTTPS with Nginx and Let's Encrypt for PBL6
# Run this on EC2: sudo bash setup-https.sh

echo "🔒 Setting up HTTPS for PBL6"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root: sudo bash setup-https.sh${NC}"
    exit 1
fi

# Get domain name from user
echo -e "${YELLOW}Enter your domain name (e.g., pbl6.yourdomain.com):${NC}"
read DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Domain name is required!${NC}"
    exit 1
fi

echo -e "${YELLOW}Enter your email for Let's Encrypt:${NC}"
read EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email is required!${NC}"
    exit 1
fi

# Step 1: Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
apt update
apt install -y nginx

# Step 2: Install Certbot
echo -e "${YELLOW}📦 Installing Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

# Step 3: Create Nginx config
echo -e "${YELLOW}📝 Creating Nginx configuration...${NC}"

cat > /etc/nginx/sites-available/pbl6 << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ${DOMAIN};
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};
    
    # SSL certificates (will be added by certbot)
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
    
    # Backend API (NestJS)
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend root endpoints
    location ~ ^/(auth|users|products|shops|posts|orders|messages|notifications|webhooks|uploads) {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket for Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3000/socket.io;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Step 4: Enable site
echo -e "${YELLOW}🔧 Enabling site...${NC}"
ln -sf /etc/nginx/sites-available/pbl6 /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Step 5: Test Nginx config
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Nginx configuration test failed!${NC}"
    exit 1
fi

# Step 6: Restart Nginx
echo -e "${YELLOW}🔄 Restarting Nginx...${NC}"
systemctl restart nginx
systemctl enable nginx

# Step 7: Obtain SSL certificate
echo -e "${YELLOW}🔒 Obtaining SSL certificate from Let's Encrypt...${NC}"
certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to obtain SSL certificate!${NC}"
    echo -e "${YELLOW}Make sure:${NC}"
    echo "  1. Domain ${DOMAIN} points to this server's IP"
    echo "  2. Port 80 and 443 are open in Security Group"
    exit 1
fi

# Step 8: Setup auto-renewal
echo -e "${YELLOW}⏰ Setting up auto-renewal...${NC}"
systemctl enable certbot.timer
systemctl start certbot.timer

# Step 9: Update frontend environment
echo -e "${YELLOW}📝 Updating frontend environment...${NC}"
if [ -f "/home/ubuntu/pbl6-fe/.env.production" ]; then
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://${DOMAIN}|g" /home/ubuntu/pbl6-fe/.env.production
else
    echo "NEXT_PUBLIC_API_URL=https://${DOMAIN}" > /home/ubuntu/pbl6-fe/.env.production
fi

# Rebuild frontend
echo -e "${YELLOW}🔨 Rebuilding frontend...${NC}"
cd /home/ubuntu/pbl6-fe
sudo -u ubuntu npm run build
sudo -u ubuntu pm2 restart pbl6-fe

echo ""
echo -e "${GREEN}✅ HTTPS setup completed!${NC}"
echo ""
echo -e "${GREEN}🌐 Your application is now accessible at:${NC}"
echo -e "${GREEN}   https://${DOMAIN}${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "  1. Make sure your domain ${DOMAIN} points to ${PUBLIC_IP}"
echo "  2. Open ports 80 and 443 in AWS Security Group"
echo "  3. Test: https://${DOMAIN}"
echo ""
echo -e "${YELLOW}🔄 SSL certificate will auto-renew every 90 days${NC}"
echo ""
echo -e "${YELLOW}📝 Useful commands:${NC}"
echo "  sudo systemctl status nginx     - Check Nginx status"
echo "  sudo certbot renew --dry-run    - Test certificate renewal"
echo "  sudo nginx -t                   - Test Nginx config"
echo "  sudo systemctl reload nginx     - Reload Nginx"
