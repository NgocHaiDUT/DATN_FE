# Hướng Dẫn Deploy Backend + Frontend lên AWS EC2

## Phần I: Chuẩn Bị EC2 Instance

### 1. Launch EC2 Instance
1. Vào **AWS Console** → **EC2** → **Launch Instances**
2. **AMI:** Ubuntu 22.04 LTS (Free tier eligible)
3. **Instance Type:** t2.micro (Free tier)
4. **Key Pair:** 
   - Tạo mới hoặc dùng cũ
   - Download `.pem` file (để ở nơi an toàn)
5. **Network Settings:** Allow SSH + HTTP + HTTPS
6. **Storage:** 20GB (Free tier)
7. Click **Launch Instance**

### 2. Connect to Instance
```bash
# Windows - dùng PowerShell hoặc Git Bash
ssh -i "path/to/key.pem" ubuntu@your-ec2-public-ip

# macOS/Linux
chmod 600 ~/path/to/key.pem
ssh -i ~/path/to/key.pem ubuntu@your-ec2-public-ip
```

---

## Phần II: Setup Server Environment

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 18 + npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# 3. Install Git
sudo apt install -y git

# 4. Install PM2 (Process Manager)
sudo npm install -g pm2

# 5. Install Nginx (Web Server)
sudo apt install -y nginx

# 6. Install PostgreSQL Client (để connect RDS)
sudo apt install -y postgresql-client

# 7. Install SSL Certbot (cho HTTPS)
sudo apt install -y certbot python3-certbot-nginx
```

---

## Phần III: Clone & Setup Backend

```bash
# 1. Navigate to home directory
cd /home/ubuntu

# 2. Clone project từ GitHub
git clone https://github.com/your-username/your-project.git
cd your-project/BE

# 3. Install dependencies
npm install

# 4. Create .env file (từ AWS credentials & RDS)
nano .env

# Paste nội dung (thay YOUR_* bằng actual values):
```

**Nội dung .env:**
```env
NODE_ENV=production
PORT=3000

# AWS S3
USE_AWS_S3=true
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=YOUR_IAM_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_IAM_SECRET_KEY
AWS_S3_BUCKET_NAME=pbl6-uploads
AWS_S3_URL=https://pbl6-uploads.s3.ap-southeast-1.amazonaws.com

# RDS Database
DATABASE_URL=postgresql://pbl6admin:YOUR_DB_PASSWORD@your-endpoint.ap-southeast-1.rds.amazonaws.com:5432/pbl6_db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-change-this

# App Config
APP_URL=https://your-domain.com
ADMIN_URL=https://admin.your-domain.com
```

```bash
# 5. Build project
npm run build

# 6. Run Prisma Migration
npx prisma migrate deploy
# hoặc
npx prisma db push

# 7. Test backend locally
npm run start:prod
# Bấm Ctrl+C để stop

# 8. Setup PM2
pm2 start dist/main.js --name "pbl6-backend"
pm2 save
pm2 startup
```

---

## Phần IV: Setup Frontend (Next.js)

```bash
# 1. Navigate to FE folder
cd /home/ubuntu/your-project/FE

# 2. Install dependencies
npm install

# 3. Create .env.local
nano .env.local
```

**Nội dung .env.local:**
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
```

```bash
# 4. Build Next.js
npm run build

# 5. Setup PM2 cho Next.js
pm2 start npm --name "pbl6-frontend" -- run start
pm2 save
```

---

## Phần V: Setup Admin (Vite)

```bash
# 1. Navigate to admin folder
cd /home/ubuntu/your-project/admin

# 2. Install dependencies
npm install

# 3. Create .env
nano .env
```

**Nội dung .env:**
```env
VITE_API_URL=https://api.your-domain.com
VITE_API_BASE_URL=https://api.your-domain.com
```

```bash
# 4. Build Vite
npm run build

# 5. Setup PM2
# Note: Vite không có built-in server cho production, ta dùng serve package
sudo npm install -g serve
pm2 start serve --name "pbl6-admin" -- -s dist -l 3002
pm2 save
```

---

## Phần VI: Cấu Hình Nginx (Reverse Proxy)

```bash
# 1. Tạo config file cho backend
sudo nano /etc/nginx/sites-available/api

# Paste:
```

**File: /etc/nginx/sites-available/api**
```nginx
upstream backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name api.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # Nginx security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Proxy settings
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

```bash
# 2. Enable site
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/api

# 3. Tương tự cho frontend
sudo nano /etc/nginx/sites-available/frontend
```

**File: /etc/nginx/sites-available/frontend**
```nginx
upstream frontend {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 4. Tương tự cho admin
sudo nano /etc/nginx/sites-available/admin
```

**File: /etc/nginx/sites-available/admin**
```nginx
upstream admin {
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name admin.your-domain.com;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/admin.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.your-domain.com/privkey.pem;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 5. Enable sites
sudo ln -s /etc/nginx/sites-available/frontend /etc/nginx/sites-enabled/frontend
sudo ln -s /etc/nginx/sites-available/admin /etc/nginx/sites-enabled/admin

# 6. Test Nginx config
sudo nginx -t

# 7. Restart Nginx
sudo systemctl restart nginx
```

---

## Phần VII: Cấu Hình SSL Certificate (Let's Encrypt)

```bash
# 1. Chắc chắn domain đã point tới EC2 IP
# (Update DNS A record tới EC2 public IP)

# 2. Get SSL certificate
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
sudo certbot certonly --nginx -d api.your-domain.com
sudo certbot certonly --nginx -d admin.your-domain.com

# 3. Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 4. Check renewal
sudo certbot renew --dry-run
```

---

## Phần VIII: Monitoring & Maintenance

### PM2 Dashboard
```bash
# Install PM2 Plus (optional, for monitoring)
pm2 plus

# View all processes
pm2 list

# View logs
pm2 logs pbl6-backend
pm2 logs pbl6-frontend

# Restart all
pm2 restart all

# Stop all
pm2 stop all

# Delete all
pm2 delete all
```

### View System Resources
```bash
# CPU & Memory
pm2 monit

# Disk space
df -h

# Memory usage
free -h
```

---

## Phần IX: Backup & Security

### 1. Database Backup (RDS Auto Backup)
- RDS tự động backup hàng ngày
- Xem backups: **RDS Dashboard** → **Automated backups**

### 2. S3 Versioning
```bash
# Enable S3 versioning (để recover deleted files)
aws s3api put-bucket-versioning --bucket pbl6-uploads --versioning-configuration Status=Enabled
```

### 3. Security Group Configuration
1. **EC2 Security Group** - cho phép:
   - SSH từ IP của bạn (port 22)
   - HTTP từ mọi nơi (port 80)
   - HTTPS từ mọi nơi (port 443)

2. **RDS Security Group** - cho phép:
   - PostgreSQL (port 5432) từ EC2 Security Group

### 4. Firewall (UFW)
```bash
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

---

## Phần X: Troubleshooting

### ❌ Backend không start
```bash
pm2 logs pbl6-backend  # Xem lỗi
npm run build  # Rebuild
pm2 restart pbl6-backend
```

### ❌ Database connection failed
```bash
# Test connection đến RDS
psql -h your-endpoint.ap-southeast-1.rds.amazonaws.com -U pbl6admin -d pbl6_db -c "SELECT 1"
```

### ❌ 502 Bad Gateway từ Nginx
```bash
# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Check if backend running
pm2 list
```

### ❌ S3 Upload Error
```bash
# Check credentials
aws s3 ls --profile default

# Check bucket policy & CORS
aws s3api get-bucket-cors --bucket pbl6-uploads
```

---

## Checklists - Deploy Production

- [ ] Tạo EC2 instance & connect
- [ ] Install Node.js, Nginx, PostgreSQL client
- [ ] Clone backend & setup .env
- [ ] Build backend & run migrations
- [ ] Setup PM2 for backend
- [ ] Clone frontend & build
- [ ] Setup PM2 for frontend
- [ ] Clone admin & build
- [ ] Setup PM2 for admin
- [ ] Cấu Hình Nginx reverse proxy
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Test tất cả 3 endpoints
- [ ] Configure AWS Security Groups
- [ ] Enable auto-renewal cho SSL
- [ ] Setup monitoring & logs
- [ ] Document credentials (lưu ở nơi an toàn)

