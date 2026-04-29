# ═══════════════════════════════════════════════════════════════
# Terraform — Variable Definitions (AWS)
# All sensitive values are loaded from terraform.tfvars
# ═══════════════════════════════════════════════════════════════

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "AWS Access Key ID"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "AWS Secret Access Key"
  type        = string
  sensitive   = true
}

variable "key_pair_name" {
  description = "Name of the AWS EC2 Key Pair (must already exist in your AWS account)"
  type        = string
}

variable "private_key_path" {
  description = "Local path to the .pem private key file for SSH"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "AMI ID for Ubuntu 22.04 LTS in the selected region"
  type        = string
  # Default: Ubuntu 22.04 LTS in us-east-1 (update if using a different region)
  default     = "ami-0c7217cdde317cfec"
}

variable "project_name" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "crowdfundin"
}

variable "environment" {
  description = "Deployment environment tag"
  type        = string
  default     = "production"
}
