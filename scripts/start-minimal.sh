#!/bin/bash
#
# Start Minimal Services
# Launches only essential services to minimize memory usage
#

set -e

echo "🚀 Starting Minimal Services for Low-Memory Development"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check cluster is running
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Kubernetes cluster not running"
    echo "   Run: ./scripts/optimize-resources.sh"
    exit 1
fi

echo ""
echo "1️⃣  Creating namespace..."
kubectl create namespace store-platform --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "2️⃣  Deploying PostgreSQL database..."
kubectl apply -f kubernetes/database/

echo ""
echo "3️⃣  Waiting for database to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n store-platform --timeout=60s

echo ""
echo "4️⃣  Creating backend configs..."
kubectl apply -f kubernetes/backend/configmap.yaml
kubectl apply -f kubernetes/backend/secret.yaml
kubectl apply -f kubernetes/backend/rbac.yaml

echo ""
echo "5️⃣  Deploying backend service (1 replica)..."
kubectl apply -f kubernetes/backend/deployment.yaml
kubectl apply -f kubernetes/backend/service.yaml

echo ""
echo "6️⃣  Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=store-service -n store-platform --timeout=90s

echo ""
echo "7️⃣  Deploying frontend (1 replica)..."
kubectl apply -f kubernetes/frontend/deployment.yaml
kubectl apply -f kubernetes/frontend/service.yaml

echo ""
echo "8️⃣  Waiting for frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend -n store-platform --timeout=60s

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Minimal Services Started!"
echo ""
echo "📊 Resource Usage:"
kubectl top pods -n store-platform 2>/dev/null || echo "   (metrics-server not installed - that's OK for minimal setup)"

echo ""
echo "🔍 Service Status:"
kubectl get pods -n store-platform

echo ""
echo "🌐 Access Points:"
echo "   Backend:  http://localhost:8080"
echo "   Frontend: http://localhost:3001"
echo ""
echo "⚠️  Don't forget to run in a separate terminal:"
echo "   sudo minikube tunnel"
echo ""
echo "💡 Skipped services (to save memory):"
echo "   - Prometheus"
echo "   - Grafana"
echo "   - Metrics Server"
echo "   - HPA (Horizontal Pod Autoscaler)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
