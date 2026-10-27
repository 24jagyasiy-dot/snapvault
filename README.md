# 🩺 PulseCare Portal
> **A High-Availability, Resilient Multi-AZ Healthcare EHR & Diagnostic Imaging Hub on AWS**

PulseCare Portal is an enterprise clinical health record (EHR) and diagnostic radiology management platform deployed across multiple Availability Zones in the **Asia Pacific (Mumbai) `ap-south-1`** region. It is engineered to demonstrate the full spectrum of core AWS cloud architecture requirements:

- **High Availability & Zero-Downtime Routing:** Multi-AZ Application Load Balancer (`pulsecare-alb`) actively distributing traffic across `ap-south-1a` and `ap-south-1b`.
- **Encrypted Block Storage (EBS gp3):** Patient encounter notes, vital signs, and triage logs persisted directly to an encrypted EBS volume mounted at `/data/clinical_records.json`.
- **Disaster Recovery (EBS Snapshots):** Point-in-time snapshot creation and restore to recover from critical database file corruption.
- **Auditable Object Storage (Amazon S3):** Version-controlled diagnostic scans (X-Rays, MRIs, Blood Lab Reports) stored with Server-Side Encryption (`SSE-S3`) and Delete Marker recovery.
- **Dynamic Auto Scaling (ASG):** Target Tracking scaling policy (Average CPU > 50%) with a simulated emergency triage surge endpoint.
- **Zero-Credential Security:** IAM Role attached to EC2 instances (`AmazonS3FullAccess`), IMDSv2 metadata telemetry, and strict Security Group isolation.

---

## 🏗️ Architecture & AWS Practical Mapping

| Practical | AWS Capability | PulseCare Portal Implementation | Viva Demonstration |
| :--- | :--- | :--- | :--- |
| **Practical 1** | **EC2 Web Server Deployment** | Ubuntu 24.04 LTS (`t3.micro`), Next.js 16 + Node 20, PM2 process manager. IMDSv2 live metadata querying. | Top navigation banner displays live `Instance ID`, `Availability Zone`, and `Hostname`. |
| **Practical 2** | **Block & Object Storage** | 5 GiB gp3 encrypted EBS volume mounted at `/data`. S3 bucket storing diagnostic medical scans. | Show `lsblk` and `/data` mount point; show files stored in S3 bucket. |
| **Practical 3** | **Disaster Recovery & Versioning** | 1. EBS Snapshot backup & recovery.<br>2. S3 Versioning Delete Marker recovery. | 1. Delete `/data/clinical_records.json`, restore volume from snapshot.<br>2. Delete photo in S3, remove Delete Marker, photo restores instantly. |
| **Practical 4** | **Custom Multi-AZ VPC** | Custom VPC `10.0.0.0/16` with 2 public subnets (`ap-south-1a`, `ap-south-1b`) and an Internet Gateway. | Show AWS VPC Resource Map with multi-AZ topology. |
| **Practical 5** | **Application Load Balancer** | Internet-facing ALB (`HTTP:80` forwarding to Target Group `HTTP:3000`). Stickiness disabled. | Click **"Test ALB Distribution"** or refresh to see traffic alternate between `ap-south-1a` and `ap-south-1b`. |
| **Practical 6** | **Auto Scaling Group (ASG)** | Golden AMI + Launch Template + ASG (Min: 1, Desired: 2, Max: 4) with CPU target tracking at 50%. | Click **"Simulate Heavy Patient Surge"**; watch AWS launch a 3rd instance in ASG Activity tab. |
| **Practical 7** | **Cloud Security** | IAM Role on EC2 (no credentials in source code); Security Group allows inbound only from ALB; default SSE-S3 & EBS encryption. | Review Security Groups in console; show `.env.local` contains zero AWS secret keys. |

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## ☁️ EC2 Deployment & EBS Setup Guide

### 1. Connect to your EC2 Instance via SSH
```bash
ssh -i "your-key.pem" ubuntu@<YOUR-EC2-PUBLIC-IP>
```

### 2. Format & Mount the 5GB EBS Volume
```bash
# Inspect block devices (nvme1n1 on t3.micro or xvdf on t2.micro)
lsblk

# Format filesystem as ext4
sudo mkfs -t ext4 /dev/nvme1n1

# Mount to /data
sudo mkdir -p /data
sudo mount /dev/nvme1n1 /data
sudo chown -R ubuntu:ubuntu /data

# Persist mount across reboots in /etc/fstab
echo '/dev/nvme1n1 /data ext4 defaults,nofail 0 2' | sudo tee -a /etc/fstab
```

### 3. Deploy Application with PM2
```bash
# Clone repository
git clone <YOUR-REPO-URL> pulsecare
cd pulsecare

# Create production environment file
cat << 'EOF' > .env.local
S3_BUCKET_NAME=YOUR-S3-BUCKET-NAME
AWS_REGION=ap-south-1
DATA_PATH=/data/clinical_records.json
PORT=3000
EOF

# Install, build and run
npm install
npm run build

sudo npm install -g pm2
pm2 start npm --name "pulsecare" -- start -- -p 3000
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save
```

---

## 🧪 Viva Demonstration Checklist

### 1. Multi-AZ Load Balancing
1. Copy the Application Load Balancer DNS name (e.g. `http://pulsecare-alb-xxxx.ap-south-1.elb.amazonaws.com`).
2. Paste into your browser. Note the **Server Instance ID** and **Availability Zone** (`ap-south-1a`).
3. Press `Ctrl + F5` (or click **"Test ALB Distribution"**).
4. Watch the banner switch to `ap-south-1b`, proving active load distribution across multiple data centers.

### 2. EBS Snapshot Disaster Recovery
1. Add a clinical record for a patient (e.g., "Robert Taylor").
2. In AWS Console &rarr; EC2 &rarr; Volumes &rarr; Select your 5GB volume &rarr; **Actions &rarr; Create Snapshot** (`pulsecare-backup-snapshot`).
3. Simulate disaster in EC2 SSH terminal:
   ```bash
   rm /data/clinical_records.json
   ```
4. Refresh web page &rarr; records are gone.
5. In AWS Console &rarr; Snapshots &rarr; Select snapshot &rarr; **Create volume from snapshot** in `ap-south-1a`.
6. Attach restored volume and remount:
   ```bash
   sudo mount /dev/nvme1n1 /data
   ```
7. Refresh web page &rarr; All patient records are completely restored!

### 3. S3 Versioning & Delete Marker Recovery
1. Upload a diagnostic X-ray image from the portal.
2. In AWS Console &rarr; S3 &rarr; Your Bucket &rarr; `scans/` &rarr; Delete the image.
3. Refresh portal &rarr; Thumbnail is broken.
4. In S3 Console &rarr; Toggle **Show versions**.
5. Select the **Delete marker** and click **Delete**.
6. Refresh portal &rarr; The image and thumbnail return immediately!

### 4. Dynamic Auto Scaling Trigger
1. Click the button **"⚡ Simulate Heavy Patient Surge (Upscale)"** on the web page.
2. The server triggers a high-CPU calculation thread for 45 seconds.
3. Open AWS Console &rarr; EC2 &rarr; Auto Scaling Groups &rarr; **Activity** tab.
4. Within 2-3 minutes, see the CloudWatch alarm trigger and AWS automatically provision an additional EC2 instance!
