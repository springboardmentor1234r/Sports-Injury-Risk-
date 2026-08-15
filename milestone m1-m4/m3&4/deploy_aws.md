# AWS Deployment Guide - Athlete Performance Hub

> Status: configured deployment guidance only. This repository does not contain evidence of a successful AWS deployment.

This guide details the steps to deploy the Athlete Performance Hub to Amazon Web Services (AWS) using managed container orchestration and database services.

---

## 🏗 AWS Architecture Overview

```text
       [ AWS Route 53 (DNS) ]
                 │
                 ▼
     [ Application Load Balancer ]
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
[ ECS Fargate Front ]   [ ECS Fargate Back ]
 (Nginx Port 80)         (Uvicorn Port 8000)
       │                   │
       │                   ├────────────────┐
       ▼                   ▼                ▼
[ Static S3 Assets ]   [ RDS PostgreSQL ]  [ Elastic File System ]
                        (Multi-AZ DB)      (Shared MP4 Uploads)
```

---

## 1. Database Provisioning (Amazon RDS)

We recommend using **Amazon RDS for PostgreSQL** to handle data persistence, automatic backups, and Multi-AZ replication.

1. Navigate to the RDS Console and click **Create Database**.
2. Select **PostgreSQL** as the engine.
3. Choose the **Free Tier** or **Production** template depending on your workload.
4. Set DB Instance Identifier: `athlete-hub-db`.
5. Enter Master Username: `postgres` and Master Password: `yourpassword123`.
6. Configure VPC & Security Groups:
   - Ensure the database is in private subnets.
   - Configure a Security Group allowing inbound traffic on port `5432` only from the ECS tasks' security group.
7. Click **Create Database**. Note the endpoint URL (e.g. `athlete-hub-db.xxxxxx.us-east-1.rds.amazonaws.com`).

---

## 2. Storage Setup (Amazon EFS & S3)

### Video uploads (Amazon EFS)
FastAPI stores video files on the local filesystem. In a multi-instance container environment, these should be stored in a shared volume.
1. Create an **Amazon Elastic File System (EFS)**.
2. Create mount targets in your private subnets.
3. Configure the ECS Task Definition to mount the EFS volume at `/app/uploads` inside the backend container.

### Optional: Static Client Assets (Amazon S3 + CloudFront)
Alternatively, instead of running an Nginx container, you can host the React build directory directly in an **S3 Bucket** configured for static website hosting, fronted by a **CloudFront** CDN.

---

## 3. Container Orchestration (AWS ECS on Fargate)

We will use **AWS ECS (Elastic Container Service)** with **Fargate** (serverless container compute) to run our Docker containers.

### Step 3.1: Push Container Images to AWS ECR
1. Create two ECR repositories:
   ```bash
   aws ecr create-repository --repository-name athlete-hub-backend
   aws ecr create-repository --repository-name athlete-hub-frontend
   ```
2. Log in and push your local Docker images:
   ```bash
   # Login
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.us-east-1.amazonaws.com
   
   # Build & Tag Backend
   docker build -t athlete-hub-backend ./backend
   docker tag athlete-hub-backend:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/athlete-hub-backend:latest
   docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/athlete-hub-backend:latest
   
   # Build & Tag Frontend
   docker build -t athlete-hub-frontend ./frontend
   docker tag athlete-hub-frontend:latest <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/athlete-hub-frontend:latest
   docker push <your-account-id>.dkr.ecr.us-east-1.amazonaws.com/athlete-hub-frontend:latest
   ```

### Step 3.2: Configure ECS Task Definitions
1. Create a Task Definition for the **Backend**:
   - Launch type: `FARGATE`.
   - CPU: `0.5 vCPU`, Memory: `1 GB`.
   - Container Image: ECR Backend URI.
   - Environment Variables:
     - `DATABASE_URL=postgresql://postgres:yourpassword123@athlete-hub-db.xxxxxx.rds.amazonaws.com:5432/athlete_hub`
     - `JWT_SECRET_KEY=your_production_secure_jwt_secret_key`
     - `ACCESS_TOKEN_EXPIRE_MINUTES=1440`
   - Volume: Mount EFS volume at `/app/uploads`.
   - Port Mapping: `8000`.

2. Create a Task Definition for the **Frontend**:
   - Launch type: `FARGATE`.
   - CPU: `0.25 vCPU`, Memory: `0.5 GB`.
   - Container Image: ECR Frontend URI.
   - Port Mapping: `80`.
   - The frontend image is compiled with `VITE_API_URL=/` and expects same-origin `/api` and `/uploads` routing. Configure the ALB to forward those paths to the backend target group.

### Step 3.3: Launch Services under an ALB
1. Configure an **Application Load Balancer (ALB)** with target groups:
   - Target Group 1: Backend service (Forward `/api/*` and `/uploads/*` to Port 8000).
   - Target Group 2: Frontend service (Forward all other requests `/` to Port 80).
2. Configure ECS Services inside your ECS Cluster to run the tasks, registering them with the ALB.

---

## 4. Domain & SSL/TLS Configuration (Route 53 & ACM)

1. Request a public SSL certificate in **AWS Certificate Manager (ACM)** for `yourdomain.com` and `*.yourdomain.com`.
2. Configure the ALB Listener on port `443` (HTTPS) to use the ACM certificate.
3. In **Amazon Route 53**, create an Alias record pointing your custom domain name to the ALB's DNS name.

---

## 5. Production checks and safeguards

- Store `JWT_SECRET_KEY`, the RDS password, and any database URL in AWS Secrets Manager or SSM Parameter Store; do not use the development values in `docker-compose.yml`.
- Keep RDS private and permit port 5432 only from the backend task security group.
- Mount EFS at `/app/uploads` for the backend task or replace the local upload implementation with a separately reviewed object-storage integration.
- Set the backend CORS allow-list to the deployed frontend origin; the local development CORS defaults are not a production allow-list.
- Configure ALB health checks against `GET /` and verify backend, frontend, database connectivity, upload persistence, and report downloads after deployment.
- This guide does not create AWS resources or validate an AWS account, DNS, certificates, ECR images, ECS tasks, RDS, EFS, or an ALB.
