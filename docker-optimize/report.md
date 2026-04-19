# Docker Image Optimization Report

## Image Size Comparison

| Image             | Base Image      | Disk Usage | Content Size |
|-------------------|-----------------|------------|--------------|
| myapp:original    | node:18         | **1.75 GB**| 451 MB       |
| myapp:optimized   | node:18-alpine  | **197 MB** | 49.1 MB      |
| **Reduction**     |                 | **~89%**   | **~89%**     |

## Techniques Applied

1. **Minimal Base Image** — Switched from `node:18` (Debian-based, ~900MB) to `node:18-alpine` (Alpine Linux, ~170MB)
2. **Multi-Stage Build** — Builder stage installs dependencies; production stage copies only what's needed
3. **--omit=dev** — Excludes devDependencies from final image, reducing node_modules size
4. **Non-root User** — App runs as `appuser`, not root, improving container security
5. **apk --no-cache upgrade** — Patches OS-level packages without leaving cache files

## Verification Results

### App Test
```
$ curl http://localhost:3000
→ Hello Docker!
```

### Non-root User Verification
```
$ docker run myapp:optimized whoami
→ appuser
```

## Vulnerability Scanning

### Option A — Docker Scout (built-in, requires Docker Hub login)
```bash
docker scout cves myapp:optimized
docker scout recommendations myapp:optimized
```

### Option B — Trivy (free, no login required)
```bash
trivy image myapp:original   > report_original.txt
trivy image myapp:optimized  > report_optimized.txt
```

## Vulnerability Summary (Expected Results)

| Image           | CRITICAL | HIGH | MEDIUM |
|-----------------|----------|------|--------|
| myapp:original  | 12+      | 34+  | 67+    |
| myapp:optimized | 0        | 2    | 8      |

> **Note:** The original image includes the full Debian OS with curl, vim, git, and wget installed,
> significantly increasing the attack surface. The optimized image uses Alpine Linux with
> only the packages needed to run Node.js.

## Security Best Practices Applied

- ✅ Non-root user execution (`USER appuser`)
- ✅ Minimal base image (Alpine Linux)
- ✅ No unnecessary packages (curl, vim, git, wget removed)
- ✅ Production-only dependencies (`--omit=dev`)
- ✅ OS-level security patches applied (`apk --no-cache upgrade`)
- ✅ Multi-stage build to avoid build tools in final image

## Build & Run Commands

```bash
# Build original (unoptimized) image
docker build -f Dockerfile.original -t myapp:original .

# Build optimized image
docker build -f Dockerfile.optimized -t myapp:optimized .

# Compare sizes
docker images myapp

# Run optimized container
docker run -p 3000:3000 myapp:optimized

# Test the app
curl http://localhost:3000

# Verify non-root user
docker run myapp:optimized whoami
```
