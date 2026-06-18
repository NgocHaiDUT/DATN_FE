# AWS Setup - Quick Start Checklist

## 🚀 Bước 1: Chuẩn Bị AWS (30 phút)

- [ ] Tạo AWS Account (free tier)
- [ ] Tạo IAM User `pbl6-backend` với quyền S3 + RDS
- [ ] **Lưu lại:**
  - Access Key ID
  - Secret Access Key

## 🪣 Bước 2: Setup S3 cho Ảnh (15 phút)

- [ ] Tạo S3 Bucket: `pbl6-uploads`
- [ ] Uncheck "Block all public access"
- [ ] Cấu Hình CORS (copy từ AWS_SETUP_GUIDE.md)
- [ ] Cấu Hình Bucket Policy (copy từ AWS_SETUP_GUIDE.md)
- [ ] Tạo folders: `avatars/`, `products/`, `bannershops/`, `logoshops/`, `brands/`, `postimages/`, `videos/`, `chat-media/`

**Test:** Truy cập vào S3 console, có thể thấy các folders

## 🗄️ Bước 3: Setup RDS Database (15-20 phút)

- [ ] Tạo RDS PostgreSQL instance
- [ ] Chọn Free Tier (nếu dùng test)
- [ ] Master username: `pbl6admin`
- [ ] Đặt strong password & lưu lại
- [ ] Public access: **Yes**
- [ ] Database name: `pbl6_db`
- [ ] Chờ instance tạo xong (5-10 phút)
- [ ] Cấu Hình Security Group (allow port 5432)
- [ ] **Lưu lại:**
  - Endpoint: `xxx.region.rds.amazonaws.com`
  - Port: `5432`
  - Username: `pbl6admin`
  - Password: `(your-password)`
  - Database: `pbl6_db`

**Test:** Connect với pgAdmin hoặc psql
```bash
psql -h your-endpoint.ap-southeast-1.rds.amazonaws.com -U pbl6admin -d pbl6_db
```

## ⚙️ Bước 4: Cập Nhật Backend (10 phút)

1. **Mở file `.env` trong thư mục `BE/`**
   ```env
   # AWS S3
   USE_AWS_S3=true
   AWS_REGION=ap-southeast-1
   AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
   AWS_S3_BUCKET_NAME=pbl6-uploads
   AWS_S3_URL=https://pbl6-uploads.s3.ap-southeast-1.amazonaws.com

   # RDS Database
   DATABASE_URL=postgresql://pbl6admin:YOUR_PASSWORD@your-endpoint.ap-southeast-1.rds.amazonaws.com:5432/pbl6_db
   ```

2. **Chạy Prisma Migration**
   ```bash
   cd BE
   npx prisma migrate deploy
   # hoặc
   npx prisma db push
   ```

3. **Test backend locally**
   ```bash
   npm install
   npm run build
   npm run start:prod
   ```
   Backend chạy tại `http://localhost:3000`

## 🚀 Bước 5: Deploy lên EC2 (Optional - nếu production)

Xem file: `EC2_DEPLOYMENT_GUIDE.md`

**Quick Deploy:**
```bash
# 1. Launch EC2 instance (t2.micro, Ubuntu 22.04)
# 2. SSH into instance
ssh -i key.pem ubuntu@your-ec2-ip

# 3. Setup environment
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git nginx postgresql-client

# 4. Clone & deploy
git clone your-repo.git && cd your-repo/BE
npm install && npm run build

# 5. Setup PM2
sudo npm install -g pm2
pm2 start dist/main.js --name "pbl6-backend"
pm2 startup && pm2 save

# 6. Setup Nginx + SSL (xem EC2_DEPLOYMENT_GUIDE.md)
```

## 📋 Credentials Management

**QUAN TRỌNG: Lưu credentials ở nơi an toàn**

```
AWS IAM Credentials:
├── Access Key ID: ___________________
├── Secret Access Key: ___________________
└── Region: ap-southeast-1

S3:
├── Bucket: pbl6-uploads
└── URL: https://pbl6-uploads.s3.ap-southeast-1.amazonaws.com

RDS:
├── Endpoint: ___________________
├── Port: 5432
├── Username: pbl6admin
├── Password: ___________________
└── Database: pbl6_db
```

## 🧪 Testing

### Test S3 Upload
```bash
# Trong Postman hoặc curl
POST http://localhost:3000/users/upload-avatar
Content-Type: multipart/form-data

file: (chọn ảnh)

# Response sẽ trả S3 URL
```

### Test Database
```bash
# Trong BE folder
npx prisma studio
# Hoặc
psql -h your-endpoint... -U pbl6admin -d pbl6_db
```

## 💰 Cost Estimate

**Monthly (Minimal):**
- RDS (db.t3.micro): $15
- S3 Storage (50GB): $1.15
- Data Transfer: ~$1
- EC2 t2.micro (750h): Free
- **Total: ~$20-30/month**

**Scaling up:**
- RDS (db.t3.small): $30
- S3 Storage (500GB): $11.50
- Data Transfer (100GB): $9
- EC2 t2.small (8000h): $20
- **Total: ~$70-80/month**

## 🔗 Useful Links

- [AWS S3 Console](https://s3.console.aws.amazon.com/)
- [AWS RDS Console](https://console.aws.amazon.com/rds/)
- [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
- [AWS IAM Console](https://console.aws.amazon.com/iam/)

## ❓ FAQs

**Q: Có cách nào dùng local storage trong khi dev?**
A: Có! Set `USE_AWS_S3=false` trong .env, backend sẽ dùng `/uploads/` folder

**Q: Cần phải migrate data từ local sang S3 không?**
A: Không cần. Khi bật S3, ảnh mới sẽ lên S3. Ảnh cũ vẫn ở local (nếu cần migrate, copy S3 sync)

**Q: RDS có data limit không?**
A: Free tier có 20GB. Nếu vượt sẽ charge $0.23 per GB-month

**Q: Làm sao backup database?**
A: RDS tự động backup hàng ngày. Xem "Automated backups" trong RDS console

**Q: Domain chưa có, dùng IP được không?**
A: Được, nhưng HTTPS sẽ khó. Nên dùng domain (có domain free như duckdns.org)

