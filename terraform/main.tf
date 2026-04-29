# ═══════════════════════════════════════════════════════════════
# Terraform — AWS Infrastructure for CrowdFundIn
# Provisions: VPC, Security Group, EC2 instance (Ubuntu 22.04)
# ═══════════════════════════════════════════════════════════════

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# ── Data Sources ────────────────────────────────────────────────
data "aws_vpc" "default" {
  default = true
}

# ── Security Group ─────────────────────────────────────────────
resource "aws_security_group" "crowdfundin_sg" {
  name        = "${var.project_name}-sg"
  description = "Allow SSH, HTTP, and app ports for CrowdFundIn"
  vpc_id      = data.aws_vpc.default.id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # Frontend (React/nginx)
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Frontend"
  }

  # Backend (Node.js)
  ingress {
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Backend API"
  }

  # Jenkins UI
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Jenkins CI"
  }

  # Jenkins JNLP agent port
  ingress {
    from_port   = 50000
    to_port     = 50000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Jenkins agent JNLP"
  }

  # Prometheus
  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Prometheus"
  }

  # Grafana
  ingress {
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Grafana"
  }

  # All outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-sg"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ── EC2 Instance ───────────────────────────────────────────────
resource "aws_instance" "crowdfundin_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.crowdfundin_sg.id]

  root_block_device {
    volume_size = 20   # GB — enough for Docker images
    volume_type = "gp3"
  }

  # Bootstrap: install Docker + Docker Compose on first boot
  user_data = <<-EOF
    #!/bin/bash
    set -euxo pipefail
    apt-get update -y
    apt-get install -y ca-certificates curl gnupg lsb-release git

    # Docker
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    usermod -aG docker ubuntu
    systemctl enable docker
    systemctl start docker

    # Ensure docker binary is at /usr/bin/docker for Jenkins container volume mount
    ln -sf $(which docker) /usr/bin/docker || true
  EOF

  tags = {
    Name        = "${var.project_name}-server"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ── Elastic IP ─────────────────────────────────────────────────
resource "aws_eip" "crowdfundin_eip" {
  instance = aws_instance.crowdfundin_server.id
  domain   = "vpc"

  tags = {
    Name    = "${var.project_name}-eip"
    Project = var.project_name
  }
}

# ── Outputs ────────────────────────────────────────────────────
output "instance_id" {
  value       = aws_instance.crowdfundin_server.id
  description = "EC2 Instance ID"
}

output "public_ip" {
  value       = aws_eip.crowdfundin_eip.public_ip
  description = "Elastic (static) public IP of the EC2 instance"
}

output "ssh_command" {
  value       = "ssh -i ${var.private_key_path} ubuntu@${aws_eip.crowdfundin_eip.public_ip}"
  description = "SSH command to connect to the server"
}

output "frontend_url" {
  value       = "http://${aws_eip.crowdfundin_eip.public_ip}:3000"
  description = "Frontend URL"
}

output "backend_url" {
  value       = "http://${aws_eip.crowdfundin_eip.public_ip}:5000"
  description = "Backend API URL"
}

output "jenkins_url" {
  value       = "http://${aws_eip.crowdfundin_eip.public_ip}:8080"
  description = "Jenkins URL"
}

output "grafana_url" {
  value       = "http://${aws_eip.crowdfundin_eip.public_ip}:3001"
  description = "Grafana URL"
}

output "prometheus_url" {
  value       = "http://${aws_eip.crowdfundin_eip.public_ip}:9090"
  description = "Prometheus URL"
}
