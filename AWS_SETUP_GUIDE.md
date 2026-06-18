# Hướng Dẫn Setup AWS S3 + RDS cho Dự Án

## I. Tạo AWS Account & IAM User

### 1. Tạo AWS Account
- Truy cập [aws.amazon.com](https://aws.amazon.com)
- Click "Create an AWS Account"
- Hoàn thành thông tin & thanh toán

### 2. Tạo IAM User với quyền S3 + RDS
1. Vào **IAM Dashboard** → **Users** → **Create user**
2. Đặt tên: `pbl6-backend`
3. Click **Next** → **Attach policies directly**
4. Tìm và chọn:
   - `AmazonS3FullAccess`
   - `AmazonRDSFullAccess` (hoặc tạo policy tùy chỉnh)
5. Click **Create user**
6. Click vào user vừa tạo → **Security credentials** → **Create access key**
7. Chọn **Application running on an AWS compute service**
8. **Lưu lại:**
   - `Access Key ID`
   - `Secret Access Key`

---

## II. Tạo S3 Bucket cho Upload Ảnh

### 1. Tạo Bucket
1. Vào **S3** → **Create bucket**
2. **Bucket name:** `pbl6-uploads` (phải unique globally)
3. **Region:** `ap-southeast-1` (Singapore)
4. Uncheck: **Block all public access** (vì cần public access cho ảnh)
5. Click **Create bucket**

### 2. Cấu Hình CORS
1. Vào bucket → **Permissions** → **CORS**
2. Paste:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://yourdomain.com",
      "http://localhost:3001",
      "http://localhost:5173"
    ],
    "ExposeHeaders": ["ETag", "x-amz-version-id"],
    "MaxAgeSeconds": 3000
  }
]
```

### 3. Cấu Hình Bucket Policy (Public Read)
1. Vào **Permissions** → **Bucket policy**
2. Paste:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::pbl6-uploads/*"
    }
  ]
}
```

### 4. Tạo Thư Mục (Folders)
- `avatars/`
- `products/`
- `bannershops/`
- `logoshops/`
- `brands/`
- `postimages/`
- `videos/`
- `chat-media/`

---

## III. Tạo RDS PostgreSQL Database

### 1. Tạo Database Instance
1. Vào **RDS** → **Create database**
2. **Engine:** PostgreSQL
3. **Version:** 15 (hoặc mới nhất)
4. **Templates:** Free tier (nếu muốn test)
5. **Credentials:**
   - **Master username:** `pbl6admin`
   - **Master password:** (tạo password mạnh, lưu lại)
6. **Connectivity:**
   - **Public access:** Yes (nếu muốn access từ localhost)
7. **Additional configuration:**
   - **Database name:** `pbl6_db`
8. Click **Create database** (chờ 5-10 phút)

### 2. Cấu Hình Security Group
1. Vào database instance → **Connectivity & security**
2. Click vào **VPC security group**
3. **Inbound rules** → **Edit inbound rules**
4. Thêm rule:
   - **Type:** PostgreSQL
   - **Port:** 5432
   - **Source:** Anywhere (0.0.0.0/0) hoặc IP của bạn
5. **Save rules**

### 3. Lấy Connection Info
1. Vào database instance → copy:
   - **Endpoint:** (hostname)
   - **Port:** 5432
2. Format connection string:
```
postgresql://pbl6admin:YOUR_PASSWORD@your-endpoint.region.rds.amazonaws.com:5432/pbl6_db
```

---

## IV. Cấu Hình Backend (.env)

### 1. Update `.env` file (BE folder)
```env
# Database - RDS PostgreSQL
DATABASE_URL="postgresql://pbl6admin:YOUR_PASSWORD@your-endpoint.region.rds.amazonaws.com:5432/pbl6_db"

# AWS S3
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=YOUR_IAM_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_IAM_SECRET_KEY
AWS_S3_BUCKET_NAME=pbl6-uploads
AWS_S3_URL=https://pbl6-uploads.s3.ap-southeast-1.amazonaws.com

# (Giữ các config khác như cũ)
```

### 2. Chạy Prisma Migration
```bash
cd BE
npx prisma migrate dev
# hoặc
npx prisma db push
```

---

## V. Cập Nhật Backend Code

### 1. Kiểm Tra avatar.config.ts
File: `BE/src/users/config/avatar.config.ts`
```typescript
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

// Validate S3 credentials
if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_S3_BUCKET_NAME
) {
  throw new Error(
    'Missing AWS S3 configuration. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET_NAME in your .env file',
  );
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const avatarUpload = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_S3_BUCKET_NAME!,
  acl: 'public-read',
  key: (req, file, cb) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    cb(null, `avatars/${filename}`);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
});
```

### 2. Tạo config cho Product Images
Tạo file: `BE/src/product/config/product-upload.config.ts`
```typescript
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const productUpload = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_S3_BUCKET_NAME!,
  acl: 'public-read',
  key: (req, file, cb) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    cb(null, `products/${filename}`);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
});
```

### 3. Cập Nhật main.ts (xóa static assets)
```typescript
// ❌ Xóa dòng này (không cần serve từ local nữa):
// app.useStaticAssets(join(process.cwd(), 'uploads'), {
//   prefix: '/uploads/',
// });

// Vì ảnh giờ từ S3 URLs như:
// https://pbl6-uploads.s3.ap-southeast-1.amazonaws.com/products/timestamp-filename.jpg
```

---

## VI. Deploy Backend lên AWS

### Option 1: EC2 + PM2 (Recommended cho Development)
```bash
# SSH vào EC2
ssh -i your-key.pem ec2-user@your-ec2-ip

# Update system
sudo yum update -y
sudo yum install nodejs npm git -y

# Clone repo
git clone your-repo.git
cd Project/BE

# Install dependencies
npm install

# Copy .env
# (Paste AWS credentials và RDS connection string)

# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/main.js --name "pbl6-backend"
pm2 save
pm2 startup
```

### Option 2: ECS + Fargate (Recommended cho Production)
1. Tạo ECR repository
2. Push Docker image
3. Tạo ECS task definition
4. Tạo ECS service

### Option 3: Docker + ECS (Easiest)
File: `BE/Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

---

## VII. Kiểm Tra & Test

### 1. Test Connection
```bash
# Test Database
psql -h your-endpoint.region.rds.amazonaws.com -U pbl6admin -d pbl6_db

# Test S3 Upload (từ API)
curl -X POST http://localhost:3000/upload \
  -F "file=@image.jpg"
```

### 2. Logs & Monitoring
- **CloudWatch** - xem logs
- **CloudTrail** - audit trail
- **Performance Insights** - monitor RDS

---

## VIII. Cost Estimates (Monthly)

| Service | Free Tier | Estimate |
|---------|-----------|----------|
| RDS PostgreSQL | 750h/month | $30-50 |
| S3 Storage | 5GB | $0.10 per GB |
| EC2 (t2.micro) | 750h/month | $10-15 |
| Data Transfer | First 1GB free | $0.09 per GB |

**Total:** ~$50-100/month (nếu traffic vừa phải)

---

## IX. Troubleshooting

### ❌ "Missing AWS S3 configuration"
- Kiểm tra `.env` file có đầy đủ 3 biến: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`

### ❌ "Access Denied" khi upload
- Kiểm tra IAM permissions của access key
- Kiểm tra S3 bucket policy cho phép put object

### ❌ "Database connection failed"
- Kiểm tra security group cho phép port 5432
- Kiểm tra password đúng
- Kiểm tra endpoint DNS resolve được

### ❌ CORS error từ Frontend
- Cập nhật CORS policy trong bucket
- Thêm domain frontend vào allowed origins

---

## Checklists

- [ ] Tạo AWS Account + IAM User
- [ ] Tạo S3 Bucket
- [ ] Cấu Hình CORS + Bucket Policy
- [ ] Tạo RDS PostgreSQL
- [ ] Lấy Credentials + Connection String
- [ ] Cập Nhật `.env` file
- [ ] Chạy Prisma Migration
- [ ] Test Upload S3 từ API
- [ ] Test Database Connection
- [ ] Deploy Backend lên AWS
- [ ] Update Frontend URLs (nếu cần)

