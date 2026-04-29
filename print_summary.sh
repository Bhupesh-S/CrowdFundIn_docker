#!/bin/bash

# Get sizes in bytes
BACKEND_ORIG_BYTES=$(docker image inspect crowdfundin-backend:original --format='{{.Size}}')
BACKEND_OPT_BYTES=$(docker image inspect crowdfundin-backend:optimized --format='{{.Size}}')
FRONTEND_ORIG_BYTES=$(docker image inspect crowdfundin-frontend:original --format='{{.Size}}')
FRONTEND_OPT_BYTES=$(docker image inspect crowdfundin-frontend:optimized --format='{{.Size}}')

# Convert to MB (using awk for floating point math)
BACKEND_ORIG_MB=$(awk "BEGIN {printf \"%.2f\", $BACKEND_ORIG_BYTES/1048576}")
BACKEND_OPT_MB=$(awk "BEGIN {printf \"%.2f\", $BACKEND_OPT_BYTES/1048576}")
FRONTEND_ORIG_MB=$(awk "BEGIN {printf \"%.2f\", $FRONTEND_ORIG_BYTES/1048576}")
FRONTEND_OPT_MB=$(awk "BEGIN {printf \"%.2f\", $FRONTEND_OPT_BYTES/1048576}")

# Calculate percentage reduction
BACKEND_RED=$(awk "BEGIN {printf \"%.2f\", (($BACKEND_ORIG_BYTES - $BACKEND_OPT_BYTES) / $BACKEND_ORIG_BYTES) * 100}")
FRONTEND_RED=$(awk "BEGIN {printf \"%.2f\", (($FRONTEND_ORIG_BYTES - $FRONTEND_OPT_BYTES) / $FRONTEND_ORIG_BYTES) * 100}")

echo "================================================"
echo "    DOCKER IMAGE SIZE COMPARISON SUMMARY"
echo "================================================"
echo ""
printf "%-15s | %-12s | %-12s | %-10s\n" "Service" "Original" "Optimized" "Reduction"
echo "----------------|--------------|--------------|-----------"
printf "%-15s | %-9s MB | %-9s MB | %s%%\n" "Backend" "$BACKEND_ORIG_MB" "$BACKEND_OPT_MB" "$BACKEND_RED"
printf "%-15s | %-9s MB | %-9s MB | %s%%\n" "Frontend" "$FRONTEND_ORIG_MB" "$FRONTEND_OPT_MB" "$FRONTEND_RED"
echo ""
echo "================================================"
echo "          SECURITY IMPROVEMENTS SUMMARY"
echo "================================================"
echo "Backend:"
echo " - Base Image   : Used node:18.20-alpine3.20 (Minimal Linux distribution)"
echo " - Build Stage  : Separated dependency installation from final runtime image"
echo " - Tools Stripped: Excluded devDependencies and cleared npm cache"
echo " - Privilege    : Enforced 'USER node' (non-root execution)"
echo ""
echo "Frontend:"
echo " - Base Image   : Used nginx:1.27-alpine (Minimal footprint web server)"
echo " - Build Stage  : Separated React compilation from final serving environment"
echo " - Tools Stripped: Removed Node.js, npm, and source code entirely"
echo " - Privilege    : Enforced 'USER nginx' (non-root execution) with custom path permissions"
echo ""
echo "================================================"
echo "         HOW TO COMPARE ORIGINAL VS OPTIMIZED"
echo "================================================"
echo ""
echo " Run original stack:"
echo " docker compose -f docker-compose.original.yml up -d"
echo ""
echo " Run optimized stack:"
echo " docker compose -f docker-compose.optimized.yml up -d"
echo ""
echo " Compare image sizes live:"
echo " docker images --format \"table {{.Repository}}\t{{.Tag}}\t{{.Size}}\" | grep -E \"frontend|backend\""
echo ""
echo " Inspect a specific image size:"
echo " docker image inspect <image>:<tag> --format='{{.Size}}'"
echo ""
echo " Stop original stack:"
echo " docker compose -f docker-compose.original.yml down"
echo ""
echo " Stop optimized stack:"
echo " docker compose -f docker-compose.optimized.yml down"
echo ""
echo "================================================"
