# Docker Image Optimization and Security Report

This document outlines the specific strategies employed in this project to optimize Docker container sizes and harden their security posture.

## 1. Minimal Base Images
The original image (`docker/Dockerfile.original`) utilized the massive `node:18` base image, which installs a full Debian operating system (over 1GB+). 

Our optimized image (`docker/Dockerfile.optimized`) transitioned to **`node:18-alpine`**, which shrinks the base footprint to under ~150MB by substituting the heavy standard distribution libraries for `musl libc` and `busybox`.

## 2. Multi-Stage Builds
To prevent unnecessary build tools from bleeding into the final production image, the Dockerfile employs a **multi-stage build process**.

### Stage 1: Builder
Installs all application dependencies, crucially leveraging the `--omit=dev` flag. This prevents development dependencies (e.g., testing frameworks, linters) from adding bloat and expanding the attack surface.

### Stage 2: Production
A fresh Alpine layer is created to house the final runtime. Rather than moving over the entire working directory tree, only the specifically required binaries and libraries from `Stage 1` (the isolated `node_modules` and `index.js`) are copied. 

We also stripped out extra packages present in the original configuration (unnecessary debuggers like `vim`, `git`, and `wget` are omitted entirely).

## 3. Running as a Non-Root User
By default, Docker container processes run with root privileges. In the event of an application compromise, root access allows an attacker complete control over the container.

We remediated this by embedding the following commands:
```dockerfile
# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```
This creates a severely restricted `appuser` namespace, stripping out OS-level capability rights from the node process mapping.

## 4. Automatic OS Patching
Alpine base images—while small and secure—inevitably harbor zero-day CVEs over time. 
We introduced a proactive protection mechanism during the build layer:
```dockerfile
RUN apk --no-cache upgrade
```
This ensures that whenever the docker image is rebuilt, the most recent kernel and utility security patches are instantly bundled without caching stale repositories.

## 5. Automated Dependency and Container Scanning
In conjunction with structural Dockerfile improvements, the CI/CD pipeline (`Jenkinsfile`) enforces a rigorous security auditing stage. Before deployment, the `docker scout cves` tool automatically scans the compiled image footprint to identify known Common Vulnerabilities and Exposures (CVEs), failing the pipeline blockingly to prevent compromised builds from reaching staging.
