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
variable "app_port" {
  description = "External port for the app"
  type        = number
  default     = 3000
}

variable "app_image" {
  description = "Docker image for the app"
  type        = string
  default     = "devops-app:optimized"
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

# ── Application Container ─────────────────────────────────────
resource "docker_image" "app" {
  name = var.app_image
}

resource "docker_container" "app" {
  name  = "devops-app-terraform"
  image = docker_image.app.image_id

  ports {
    internal = 3000
    external = var.app_port
  }

  env = [
    "NODE_ENV=${var.environment}",
    "PORT=3000"
  ]

  networks_advanced {
    name = docker_network.devops_network.name
  }

  restart = "unless-stopped"
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

  depends_on = [docker_container.app]
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
output "app_url" {
  value       = "http://localhost:${var.app_port}"
  description = "URL to access the application"
}

output "prometheus_url" {
  value       = "http://localhost:9090"
  description = "URL to access Prometheus"
}

output "grafana_url" {
  value       = "http://localhost:3001"
  description = "URL to access Grafana"
}

output "app_container_id" {
  value = docker_container.app.id
}
