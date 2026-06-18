# Docker + AWS Deployment

This project has three production containers:

- `backend`: NestJS API on port `3000`
- `frontend`: Next.js user app on port `3001`
- `admin`: Vite admin app served by Nginx on port `3002`

## 1. Prepare env files

Keep secrets on the server, not inside Docker images.

Backend uses `BE/.env` at runtime. It should contain production values:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DATABASE_URL=postgresql://USER:PASSWORD@YOUR_RDS_ENDPOINT:5432/pbl6_db

USE_AWS_S3=true
USE_S3=true
STORAGE_DRIVER=s3
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_S3_BUCKET_NAME=YOUR_BUCKET
AWS_S3_URL=https://YOUR_BUCKET.s3.ap-southeast-1.amazonaws.com

FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com
ADMIN_URL=https://admin.your-domain.com
```

Root Compose values use `.env`. Start from:

```bash
cp .env.docker.example .env
```

Then edit `.env` for your public domains.

## 2. Test Docker locally

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

Run database migration against RDS:

```bash
docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
```

Open:

- Backend Swagger: `http://localhost:3000/api`
- Frontend: `http://localhost:3001`
- Admin: `http://localhost:3002`

## 3. Deploy simple way: EC2 + Docker Compose

On EC2 Ubuntu:

```bash
sudo apt update
sudo apt install -y ca-certificates curl git nginx
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker
```

Clone project, create `BE/.env` and root `.env`, then:

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d
```

Security Group:

- EC2: allow `22` from your IP, `80` and `443` from internet
- RDS: allow `5432` only from the EC2 Security Group

## 4. Nginx reverse proxy on EC2

Use Nginx on the host to expose HTTPS domains:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name admin.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then enable HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
sudo certbot --nginx -d admin.your-domain.com
```

## 5. Optional: push images to ECR

For a cleaner production flow, build locally or in CI and push to Amazon ECR:

```bash
aws ecr create-repository --repository-name pbl6-backend --region ap-southeast-1
aws ecr create-repository --repository-name pbl6-frontend --region ap-southeast-1
aws ecr create-repository --repository-name pbl6-admin --region ap-southeast-1

aws ecr get-login-password --region ap-southeast-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com

docker build -t pbl6-backend ./BE
docker tag pbl6-backend:latest ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/pbl6-backend:latest
docker push ACCOUNT_ID.dkr.ecr.ap-southeast-1.amazonaws.com/pbl6-backend:latest
```

Repeat tagging/pushing for `frontend` and `admin`, then pull those images on EC2 or use them in ECS.

## 6. Useful commands

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker system prune -f
```
