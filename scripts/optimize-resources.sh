#!/bin/bash
#
# Memory Optimization Script
# Reconfigures Minikube with minimal resources for local development
#

set -e

echo "🔧 Optimizing Docker and Kubernetes for Low Memory Usage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if minikube is installed
if ! command -v minikube &> /dev/null; then
    echo "❌ Minikube not found. Please install minikube first."
    exit 1
fi

echo ""
echo "📊 Current Minikube Status:"
minikube status || echo "Minikube not running"

echo ""
echo "⚠️  This will DELETE the existing minikube cluster and create a new one"
echo "    with optimized resource settings:"
echo "    - CPUs: 2"
echo "    - Memory: 3Gi (3072Mi)"
echo "    - Disk: 15Gi"
echo ""
read -p "Continue? (yes/no): " confirm

if [[ "$confirm" != "yes" ]]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "1️⃣  Stopping existing Minikube cluster..."
minikube stop 2>/dev/null || echo "   (cluster not running)"

echo ""
echo "2️⃣  Deleting existing cluster..."
minikube delete 2>/dev/null || echo "   (no cluster to delete)"

echo ""
echo "3️⃣  Creating optimized Minikube cluster..."
minikube start \
  --cpus=2 \
  --memory=3072 \
  --disk-size=15g \
  --driver=docker \
  --kubernetes-version=v1.28.0

echo ""
echo "4️⃣  Verifying cluster..."
kubectl cluster-info

echo ""
echo "5️⃣  Checking resource allocation..."
MEMORY_BYTES=$(docker inspect minikube --format '{{.HostConfig.Memory}}')
MEMORY_GB=$(echo "scale=2; $MEMORY_BYTES / 1024 / 1024 / 1024" | bc)
echo "   ✅ Memory allocated: ${MEMORY_GB}Gi"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Optimization Complete!"
echo ""
echo "📦 Next Steps:"
echo "   1. Build your Docker images:"
echo "      eval \$(minikube docker-env)"
echo "      docker build -t store-service:v1.2.2 ."
echo ""
echo "   2. Deploy minimal services:"
echo "      ./scripts/start-minimal.sh"
echo ""
echo "   3. Start minikube tunnel (in separate terminal):"
echo "      minikube tunnel"
echo ""
echo "💡 Memory Savings: ~2-4Gi freed up for development"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
