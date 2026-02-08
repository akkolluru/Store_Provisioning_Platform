#!/bin/bash
# Quick Recovery Script - Redeploy Infrastructure

set -e

echo "🚨 RECOVERING DELETED INFRASTRUCTURE..."
echo ""

# 1. Recreate namespace
echo "1️⃣ Creating store-platform namespace..."
kubectl create namespace store-platform

# 2. Deploy infrastructure
echo ""
echo "2️⃣ Deploying PostgreSQL, Redis, Vault..."
cd /Users/kaushik/Projects/urumi_ai/Store_Provisioning_Platform

helm install postgresql oci://registry-1.docker.io/bitnamicharts/postgresql \
  --namespace store-platform \
  --set primary.resources.requests.memory=512Mi \
  --set primary.resources.limits.memory=1Gi \
  --set readReplicas.replicaCount=1 \
  --wait --timeout=5m

helm install redis oci://registry-1.docker.io/bitnamicharts/redis \
  --namespace store-platform \
  --set master.resources.requests.memory=128Mi \
  --set master.resources.limits.memory=256Mi \
  --wait --timeout=3m

helm install vault hashicorp/vault \
  --namespace store-platform \
  --set server.dev.enabled=true \
  --set injector.enabled=true \
  --wait --timeout=3m

# 3. Apply backend RBAC and deployment
echo ""
echo "3️⃣ Deploying backend service..."
kubectl apply -f kubernetes/backend/rbac.yaml
kubectl apply -f kubernetes/backend/configmap.yaml
kubectl apply -f kubernetes/backend/secret.yaml
kubectl apply -f kubernetes/backend/deployment.yaml
kubectl apply -f kubernetes/backend/service.yaml
kubectl apply -f kubernetes/backend/hpa.yaml

# 4. Deploy frontend
echo ""
echo "4️⃣ Deploying frontend..."
kubectl apply -f kubernetes/frontend/deployment.yaml
kubectl apply -f kubernetes/frontend/service.yaml

# 5. Wait for everything
echo ""
echo "5️⃣ Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod -l app=store-service -n store-platform --timeout=180s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n store-platform --timeout=180s

echo ""
echo "✅ Infrastructure recovered!"
echo ""
echo "Next steps:"
echo "1. Port-forward: kubectl port-forward -n store-platform svc/store-service 3000:80"
echo "2. Run migrations: cd database/migrations && ./run-migrations.sh"
echo "3. Restart tunnel: sudo minikube tunnel"
