#!/bin/bash

# Setup Self-Signed SSL Certificate for IP address
# WARNING: Browser will show security warning
# Only use for testing, NOT for production

echo "🔒 Setting up Self-Signed SSL for IP address"
echo "=============================================="
echo "⚠️  WARNING: Browser will show security warning"
echo "⚠️  This is ONLY for testing, NOT for production"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root: sudo bash setup-self-signed-ssl.sh${NC}"
    exit 1
fi

# Get server IP
SERVER_IP=$(curl -s ifconfig.me)
echo -e "${YELLOW}Server IP: ${SERVER_IP}${NC}"

# Step 1: Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
apt update
apt install -y nginx

# Step 2: Create SSL directory
echo -e "${YELLOW}📁 Creating SSL directory...${NC}"
mkdir -p /etc/nginx/ssl

# Step 3: Generate self-signed certificate
echo -e "${YELLOW}🔐 Generating self-signed certificate...${NC}"
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/selfsigned.key \
  -out /etc/nginx/ssl/selfsigned.crt \
  -subj "/C=VN/ST=HCM/L=HCM/O=PBL6/CN=${SERVER_IP}" \
  -addext "subjectAltName=IP:${SERVER_IP}"

# Step 4: Create Nginx config
echo -e "${YELLOW}📝 Creating Nginx configuration...${NC}"

cat > /etc/nginx/sites-available/pbl6-ssl << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ${SERVER_IP};
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name ${SERVER_IP};
    
    # Self-signed SSL certificate
    ssl_certificate /etc/nginx/ssl/selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/selfsigned.key;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
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

# Step 5: Enable site
echo -e "${YELLOW}🔧 Enabling site...${NC}"
ln -sf /etc/nginx/sites-available/pbl6-ssl /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Step 6: Test Nginx config
echo -e "${YELLOW}🧪 Testing Nginx configuration...${NC}"
nginx -t

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Nginx configuration test failed!${NC}"
    exit 1
fi

# Step 7: Restart Nginx
echo -e "${YELLOW}🔄 Restarting Nginx...${NC}"
systemctl restart nginx
systemctl enable nginx

# Step 8: Update frontend environment
echo -e "${YELLOW}📝 Updating frontend environment...${NC}"
if [ -f "/home/ubuntu/pbl6-fe/.env.production" ]; then
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://${SERVER_IP}|g" /home/ubuntu/pbl6-fe/.env.production
else
    echo "NEXT_PUBLIC_API_URL=https://${SERVER_IP}" > /home/ubuntu/pbl6-fe/.env.production
fi

# Rebuild frontend
echo -e "${YELLOW}🔨 Rebuilding frontend...${NC}"
cd /home/ubuntu/pbl6-fe
sudo -u ubuntu npm run build
sudo -u ubuntu pm2 restart pbl6-fe

echo ""
echo -e "${GREEN}✅ Self-signed SSL setup completed!${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Browser will show security warning!${NC}"
echo ""
echo -e "${GREEN}🌐 Access your application at:${NC}"
echo -e "${GREEN}   https://${SERVER_IP}${NC}"
echo ""
echo -e "${YELLOW}📋 To bypass browser warning:${NC}"
echo ""
echo -e "${YELLOW}Chrome/Edge:${NC}"
echo "  1. Visit https://${SERVER_IP}"
echo "  2. Click 'Advanced'"
echo "  3. Click 'Proceed to ${SERVER_IP} (unsafe)'"
echo ""
echo -e "${YELLOW}Firefox:${NC}"
echo "  1. Visit https://${SERVER_IP}"
echo "  2. Click 'Advanced'"
echo "  3. Click 'Accept the Risk and Continue'"
echo ""
echo -e "${RED}⚠️  This is NOT secure for production!${NC}"
echo -e "${RED}⚠️  Use a real domain with Let's Encrypt for production${NC}"
echo ""
echo -e "${YELLOW}📝 For production, use:${NC}"
echo "  1. Get a free domain from DuckDNS.org"
echo "  2. Run: sudo bash setup-https.sh"
