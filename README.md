# 🚀 DevOps Demo Project — Topic 37: Docker Image Optimization & Security

A complete DevOps project demonstrating **Docker image optimization**, **CI/CD pipeline**, **Infrastructure as Code**, **Configuration Management**, and **Monitoring** using industry-standard tools.

---

## 📁 Project Structure

```
devops-main/
├── app/                          # Node.js Application
│   ├── index.js                  #   Express server with Prometheus metrics
│   ├── package.json              #   Dependencies
│   └── test.js                   #   Automated tests
│
├── docker/                       # Docker (Topic 37)
│   ├── Dockerfile.original       #   ❌ Unoptimized (1.75 GB)
│   └── Dockerfile.optimized      #   ✅ Optimized (197 MB) — 89% smaller
│
├── docker-compose.yml            # Docker Compose — full stack
│
├── prometheus/                   # Prometheus (Monitoring)
│   └── prometheus.yml            #   Scrape config
│
├── grafana/                      # Grafana (Dashboards)
│   ├── dashboards/
│   │   └── app-dashboard.json    #   Pre-built dashboard
│   └── provisioning/
│       ├── datasources/
│       │   └── datasource.yml    #   Auto-provision Prometheus
│       └── dashboards/
│           └── dashboard.yml     #   Auto-load dashboards
│
├── terraform/                    # Terraform (IaC)
│   └── main.tf                   #   Docker provider config
│
├── ansible/                      # Ansible (Configuration Management)
│   ├── playbook.yml              #   Deployment playbook
│   └── inventory.ini             #   Server inventory
│
├── Jenkinsfile                   # Jenkins (CI/CD Pipeline)
├── .gitignore                    # Git ignore rules
├── report.md                     # Image optimization report
└── README.md                     # This file
```

---

## 🛠️ Tools Used

| Tool | Purpose | Files |
|------|---------|-------|
| **Docker** | Containerization & Image Optimization (Topic 37) | `docker/Dockerfile.*` |
| **Docker Compose** | Multi-container orchestration | `docker-compose.yml` |
| **Prometheus** | Metrics collection & monitoring | `prometheus/prometheus.yml` |
| **Grafana** | Visualization & dashboards | `grafana/` |
| **Terraform** | Infrastructure as Code | `terraform/main.tf` |
| **Ansible** | Configuration management & deployment | `ansible/` |
| **Jenkins** | CI/CD pipeline automation | `Jenkinsfile` |
| **Git** | Version control | `.gitignore` |

---

## ⚡ Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start the entire stack (App + Prometheus + Grafana)
docker compose up -d --build

# Check all services
docker compose ps
```

**Access the services:**
| Service | URL | Credentials |
|---------|-----|-------------|
| App | http://localhost:3000 | — |
| Prometheus | http://localhost:9090 | — |
| Grafana | http://localhost:3001 | admin / admin123 |

### Option 2: Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### Option 3: Ansible

```bash
cd ansible
ansible-playbook -i inventory.ini playbook.yml
```

---

## 📊 Topic 37: Docker Image Optimization Report

### Image Size Comparison

| Image | Base Image | Size | Reduction |
|-------|-----------|------|-----------|
| myapp:original | `node:18` | **1.75 GB** | — |
| myapp:optimized | `node:18-alpine` | **197 MB** | **~89%** |

### Optimization Techniques Applied

1. **Minimal Base Image** — `node:18-alpine` instead of `node:18`
2. **Multi-Stage Build** — Builder installs deps; production copies only what's needed
3. **`--omit=dev`** — Excludes devDependencies from final image
4. **Non-root User** — App runs as `appuser`, not root
5. **`apk --no-cache upgrade`** — Patches OS-level packages

### Build & Verify

```bash
# Build both images
docker build -f docker/Dockerfile.original -t myapp:original .
docker build -f docker/Dockerfile.optimized -t myapp:optimized .

# Compare sizes
docker images myapp

# Verify non-root user
docker run --rm myapp:optimized whoami
# → appuser

# Run and test
docker run -p 3000:3000 myapp:optimized
curl http://localhost:3000
# → {"message":"Hello Docker!","version":"1.0.0","environment":"production"}
```

### Vulnerability Scanning

```bash
# Docker Scout
docker scout cves myapp:optimized

# Trivy (alternative)
trivy image myapp:optimized
```

---

## 🔄 Jenkins CI/CD Pipeline

The `Jenkinsfile` defines an 8-stage pipeline:

```
Checkout → Install → Test → Docker Build (parallel) → Size Report → Security Scan → Deploy → Verify
```

| Stage | Description |
|-------|-------------|
| Checkout | Pull code from Git |
| Install Dependencies | `npm install` |
| Test | Run automated tests |
| Docker Build | Build original AND optimized images (parallel) |
| Image Size Report | Compare image sizes |
| Security Scan | Scan with Docker Scout |
| Deploy | `docker compose up -d` |
| Verify | Health check all services |

---

## 📈 Monitoring Stack

### Prometheus
- Scrapes the app's `/metrics` endpoint every 5 seconds
- Collects HTTP request counts, durations, memory, and CPU metrics
- Access at: http://localhost:9090

### Grafana
- Pre-configured dashboard with 6 panels:
  - HTTP Requests per Second
  - Request Duration (p95)
  - Total Requests
  - App Uptime
  - Memory Usage
  - CPU Usage
- Auto-provisioned with Prometheus datasource
- Access at: http://localhost:3001 (admin/admin123)

---

## 🏗️ Terraform (Infrastructure as Code)

Provisions the full stack using the Docker provider:

```bash
cd terraform
terraform init       # Initialize providers
terraform plan       # Preview changes
terraform apply      # Create infrastructure
terraform destroy    # Tear down
```

**Resources created:**
- Docker network
- App container (from optimized image)
- Prometheus container
- Grafana container

---

## 🤖 Ansible (Configuration Management)

Automates deployment to servers:

```bash
cd ansible
ansible-playbook -i inventory.ini playbook.yml
```

**Tasks performed:**
1. Install Docker & prerequisites
2. Copy project files to server
3. Build optimized Docker image
4. Start Docker Compose stack
5. Verify all services are healthy

---

## 🛑 Stop / Cleanup

```bash
# Stop Docker Compose stack
docker compose down

# Remove volumes too
docker compose down -v

# Terraform destroy
cd terraform && terraform destroy
```
