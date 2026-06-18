---
description: Deploy Next.js app to EC2
---

# Deploy Next.js Application to EC2

## Bước 1: Chuẩn bị môi trường EC2

### 1.1. Cài đặt Node.js và npm trên EC2
```bash
# Cập nhật hệ thống
sudo yum update -y  # Cho Amazon Linux
# hoặc
sudo apt update && sudo apt upgrade -y  # Cho Ubuntu

# Cài đặt Node.js (phiên bản 18 hoặc cao hơn)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -  # Amazon Linux
# hoặc
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -  # Ubuntu

sudo yum install -y nodejs  # Amazon Linux
# hoặc
sudo apt install -y nodejs  # Ubuntu

# Kiểm tra phiên bản
node --version
npm --version
```

### 1.2. Cấu hình Security Group
Mở các cổng sau trong AWS Security Group:
- **Port 22**: SSH
- **Port 80**: HTTP (optional, nếu dùng reverse proxy)
- **Port 443**: HTTPS (optional, nếu có SSL)
- **Port 3001**: Cổng ứng dụng Next.js
  - Type: Custom TCP
  - Source: 0.0.0.0/0 (hoặc IP cụ thể để bảo mật hơn)

## Bước 2: Upload code lên EC2

### 2.1. Clone repository hoặc upload code
```bash
# Nếu dùng Git
git clone <repository-url>
cd pbl6-fe

# Hoặc upload bằng SCP từ máy local
# scp -i your-key.pem -r d:\PBL6\pbl6-fe ec2-user@<EC2-IP>:~/
```

### 2.2. Cài đặt dependencies
```bash
cd pbl6-fe
npm install
```

## Bước 3: Cấu hình biến môi trường

### 3.1. Tạo file .env.production
```bash
nano .env.production
```

### 3.2. Thêm các biến môi trường cần thiết
```
NEXT_PUBLIC_API_URL=http://<EC2-IP>:3000
# Thêm các biến môi trường khác nếu cần
```

## Bước 4: Build ứng dụng

// turbo
```bash
npm run build
```

## Bước 5: Chạy ứng dụng production

### 5.1. Chạy với npm start (cổng mặc định 3000)
```bash
npm start
```

### 5.2. Chạy với cổng tùy chỉnh (3001)
```bash
npm start -- -p 3001
```

### 5.3. Hoặc sửa package.json để cổng mặc định là 3001
Sửa script `start` trong package.json:
```json
"start": "next start -p 3001"
```

Sau đó chạy:
```bash
npm start
```

## Bước 6: Chạy ứng dụng như service (khuyến khích)

### 6.1. Sử dụng PM2 (Process Manager)
```bash
# Cài đặt PM2 globally
sudo npm install -g pm2

# Chạy ứng dụng với PM2
pm2 start npm --name "pbl6-fe" -- start

# Hoặc nếu muốn chỉ định cổng
pm2 start "npm start -- -p 3001" --name "pbl6-fe"

# Xem logs
pm2 logs pbl6-fe

# Xem status
pm2 status

# Tự động khởi động khi server restart
pm2 startup
pm2 save
```

### 6.2. Các lệnh PM2 hữu ích
```bash
# Restart app
pm2 restart pbl6-fe

# Stop app
pm2 stop pbl6-fe

# Delete app
pm2 delete pbl6-fe

# Monitor
pm2 monit
```

## Bước 7: Truy cập ứng dụng

Truy cập qua browser:
```
http://<EC2-PUBLIC-IP>:3001
```

## Bước 8: (Optional) Cấu hình Nginx Reverse Proxy

### 8.1. Cài đặt Nginx
```bash
sudo yum install -y nginx  # Amazon Linux
# hoặc
sudo apt install -y nginx  # Ubuntu
```

### 8.2. Cấu hình Nginx
```bash
sudo nano /etc/nginx/conf.d/pbl6-fe.conf
```

Thêm nội dung:
```nginx
server {
    listen 80;
    server_name <EC2-PUBLIC-IP hoặc domain>;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 8.3. Khởi động Nginx
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

Sau đó truy cập qua:
```
http://<EC2-PUBLIC-IP>
```

## Troubleshooting

### Kiểm tra ứng dụng có đang chạy không
```bash
# Kiểm tra process
ps aux | grep node

# Kiểm tra port đang lắng nghe
sudo netstat -tulpn | grep :3001
# hoặc
sudo lsof -i :3001
```

### Kiểm tra firewall
```bash
# Amazon Linux
sudo firewall-cmd --list-all

# Ubuntu
sudo ufw status
```

### Xem logs
```bash
# Nếu dùng PM2
pm2 logs pbl6-fe

# Nếu chạy trực tiếp
# Logs sẽ hiển thị trong terminal
```

## Lưu ý quan trọng

1. **Không dùng `npm run dev` cho production** - Luôn build và dùng `npm start`
2. **Sử dụng PM2** để quản lý process, tự động restart khi crash
3. **Cấu hình HTTPS** nếu deploy production thực sự (dùng Let's Encrypt)
4. **Backup dữ liệu** trước khi deploy
5. **Monitoring** - Thiết lập monitoring cho server (CloudWatch, PM2 monitoring, etc.)
