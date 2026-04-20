# ═══════════════════════════════════════════════════════════════
# Terraform — Docker Infrastructure as Code
# Provisions Docker containers locally using the Docker provider
# ═══════════════════════════════════════════════════════════════

terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
  required_version = ">= 1.0"
}

provider "docker" {
  # Uses the local Docker daemon
}

# ── Variables ──────────────────────────────────────────────────
variable "frontend_port" {
  description = "External port for the frontend"
  type        = number
  default     = 3000
}

variable "backend_port" {
  description = "External port for the backend"
  type        = number
  default     = 5000
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

# ── Docker Network ─────────────────────────────────────────────
resource "docker_network" "devops_network" {
  name = "devops-terraform-network"
}

# ── MongoDB Container ─────────────────────────────────────────
resource "docker_image" "mongo" {
  name = "mongo:6"
}

resource "docker_container" "mongo" {
  name  = "crowdfundin-mongo-terraform"
  image = docker_image.mongo.image_id

  ports {
    internal = 27017
    external = 27017
  }

  networks_advanced {
    name = docker_network.devops_network.name
  }

  restart = "unless-stopped"
}

# ── Backend Container ─────────────────────────────────────────
resource "docker_image" "backend" {
  name = "crowdfundin-backend:latest"
}

resource "docker_container" "backend" {
  name  = "crowdfundin-backend-terraform"
  image = docker_image.backend.image_id

  ports {
    internal = 5000
    external = var.backend_port
  }

  env = [
    "MONGODB_URI=mongodb://mongo:27017/crowdfundin",
    "JWT_SECRET=mysecretkey123"
  ]

  networks_advanced {
    name = docker_network.devops_network.name
  }

  restart = "unless-stopped"
  depends_on = [docker_container.mongo]
}

# ── Frontend Container ────────────────────────────────────────
resource "docker_image" "frontend" {
  name = "crowdfundin-frontend:latest"
}

resource "docker_container" "frontend" {
  name  = "crowdfundin-frontend-terraform"
  image = docker_image.frontend.image_id

  ports {
    internal = 80
    external = var.frontend_port
  }

  networks_advanced {
    name = docker_network.devops_network.name
  }

  restart = "unless-stopped"
  depends_on = [docker_container.backend]
}

# ── Prometheus Container ───────────────────────────────────────
resource "docker_image" "prometheus" {
  name = "prom/prometheus:latest"
}

resource "docker_container" "prometheus" {
  name  = "devops-prometheus-terraform"
  image = docker_image.prometheus.image_id

  ports {
    internal = 9090
    external = 9090
  }

  volumes {
    host_path      = abspath("${path.module}/../prometheus/prometheus.yml")
    container_path = "/etc/prometheus/prometheus.yml"
  }

  networks_advanced {
    name = docker_network.devops_network.name
  }

  restart = "unless-stopped"
  depends_on = [docker_container.backend]
}

# ── Grafana Container ─────────────────────────────────────────
resource "docker_image" "grafana" {
  name = "grafana/grafana:latest"
}

resource "docker_container" "grafana" {
  name  = "devops-grafana-terraform"
  image = docker_image.grafana.image_id

  ports {
    internal = 3000
    external = 3001
  }

  env = [
    "GF_SECURITY_ADMIN_USER=admin",
    "GF_SECURITY_ADMIN_PASSWORD=admin123",
  ]

  networks_advanced {
    name = docker_network.devops_network.name
  }

  restart = "unless-stopped"
  depends_on = [docker_container.prometheus]
}

# ── Outputs ────────────────────────────────────────────────────
output "frontend_url" {
  value       = "http://localhost:${var.frontend_port}"
  description = "URL to access the frontend"
}

output "backend_url" {
  value       = "http://localhost:${var.backend_port}"
  description = "URL to access the backend"
}

output "prometheus_url" {
  value       = "http://localhost:9090"
  description = "URL to access Prometheus"
}

output "grafana_url" {
  value       = "http://localhost:3001"
  description = "URL to access Grafana"
}
