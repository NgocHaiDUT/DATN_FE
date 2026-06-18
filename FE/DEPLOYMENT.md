# Deploy Next.js App to EC2

## 🎯 Tóm tắt nhanh

Để deploy ứng dụng Next.js lên EC2, bạn cần:

1. **Build ứng dụng** thay vì chạy dev mode
2. **Mở Security Group** cho port 3001
3. **Sử dụng PM2** để quản lý process

## 🚀 Quick Start (Trên EC2)

### Cách 1: Sử dụng script tự động

```bash
# Upload code lên EC2, sau đó chạy:
chmod +x deploy.sh
./deploy.sh
```

### Cách 2: Deploy thủ công

```bash
# 1. Cài đặt dependencies
npm install

# 2. Build ứng dụng
npm run build

# 3. Cài đặt PM2 (nếu chưa có)
sudo npm install -g pm2

# 4. Chạy với PM2
pm2 start ecosystem.config.js

# 5. Lưu và tự động khởi động
pm2 save
pm2 startup
```

## 📋 Yêu cầu

### Trên EC2:
- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **PM2**: Latest version (sẽ được cài tự động)

### AWS Security Group:
Mở các port sau:
- **Port 22**: SSH
- **Port 3001**: Application (Custom TCP, Source: 0.0.0.0/0)

## 🔧 Cấu hình

### Biến môi trường

Tạo file `.env.production` trên EC2:

```bash
# API endpoint
NEXT_PUBLIC_API_URL=http://YOUR_BACKEND_IP:3000

# Thêm các biến khác nếu cần
```

### PM2 Configuration

File `ecosystem.config.js` đã được cấu hình sẵn:
- **Port**: 3001
- **Auto restart**: Enabled
- **Memory limit**: 1GB
- **Logs**: Lưu trong thư mục `logs/`

## 📊 Quản lý ứng dụng

### Các lệnh PM2 thường dùng:

```bash
# Xem status
pm2 status

# Xem logs (real-time)
pm2 logs pbl6-fe

# Xem logs (file)
pm2 logs pbl6-fe --lines 100

# Restart
pm2 restart pbl6-fe

# Stop
pm2 stop pbl6-fe

# Monitor (CPU, Memory)
pm2 monit

# Xem thông tin chi tiết
pm2 show pbl6-fe
```

## 🌐 Truy cập ứng dụng

Sau khi deploy thành công, truy cập:

```
http://YOUR_EC2_PUBLIC_IP:3001
```

## 🔍 Troubleshooting

### 1. Không truy cập được qua IP

**Kiểm tra Security Group:**
```bash
# Trên AWS Console, đảm bảo Inbound Rules có:
# Type: Custom TCP
# Port: 3001
# Source: 0.0.0.0/0
```

**Kiểm tra ứng dụng có chạy không:**
```bash
pm2 status
# Hoặc
sudo netstat -tulpn | grep :3001
```

### 2. Build bị lỗi

```bash
# Xóa cache và rebuild
rm -rf .next node_modules
npm install
npm run build
```

### 3. PM2 không tự động khởi động sau khi reboot

```bash
# Chạy lại startup script
pm2 startup
# Copy và chạy lệnh được suggest
pm2 save
```

### 4. Hết memory

```bash
# Tăng memory limit trong ecosystem.config.js
# Hoặc restart PM2
pm2 restart pbl6-fe
```

## 📝 Logs

Logs được lưu trong thư mục `logs/`:
- `err.log`: Error logs
- `out.log`: Standard output
- `combined.log`: Combined logs

```bash
# Xem logs
tail -f logs/combined.log

# Hoặc dùng PM2
pm2 logs pbl6-fe --lines 50
```

## 🔒 Bảo mật (Production)

Để production thực sự, nên:

1. **Sử dụng Nginx reverse proxy** (port 80/443)
2. **Cài đặt SSL certificate** (Let's Encrypt)
3. **Giới hạn Security Group** (chỉ cho phép IP cụ thể)
4. **Sử dụng environment variables** cho sensitive data
5. **Enable firewall** trên EC2

## 📚 Tài liệu thêm

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [AWS EC2 Security Groups](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html)

## ❓ Câu hỏi thường gặp

**Q: Tại sao không dùng `npm run dev` trên production?**
A: Dev mode không tối ưu, chậm, và không an toàn. Luôn build và dùng production mode.

**Q: Có thể chạy nhiều instance không?**
A: Có, sửa `instances` trong `ecosystem.config.js` (ví dụ: `instances: 2` hoặc `instances: 'max'`)

**Q: Làm sao để update code mới?**
A: Chạy lại `./deploy.sh` hoặc `git pull && npm install && npm run build && pm2 restart pbl6-fe`

**Q: Port 3001 có bắt buộc không?**
A: Không, có thể đổi trong `package.json` và `ecosystem.config.js`. Nhớ update Security Group.
