#!/bin/bash
# Deployment script for Store Provisioning Platform
# Usage: ./scripts/deploy.sh [environment] [image-tag]
# Example: ./scripts/deploy.sh development latest

set -e

# Configuration
ENVIRONMENT=${1:-development}
IMAGE_TAG=${2:-latest}
NAMESPACE="store-platform"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment to ${ENVIRONMENT}${NC}"
echo "Image tag: ${IMAGE_TAG}"
echo "Namespace: ${NAMESPACE}"
echo ""

# Verify kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
fi

# Verify namespace exists
if ! kubectl get namespace ${NAMESPACE} &> /dev/null; then
    echo -e "${YELLOW}⚠️  Namespace ${NAMESPACE} does not exist. Creating...${NC}"
    kubectl create namespace ${NAMESPACE}
fi

# Deploy backend
echo -e "${GREEN}📦 Deploying backend service...${NC}"
kubectl set image deployment/store-service \
    store-service=ghcr.io/${GITHUB_REPOSITORY:-akkolluru/store_provisioning_platform}/backend:${IMAGE_TAG} \
    -n ${NAMESPACE} || {
    echo -e "${YELLOW}⚠️  Backend deployment not found, applying manifests...${NC}"
    kubectl apply -f kubernetes/backend/ -n ${NAMESPACE}
}

# Wait for backend rollout
echo -e "${GREEN}⏳ Waiting for backend rollout...${NC}"
kubectl rollout status deployment/store-service -n ${NAMESPACE} --timeout=300s

# Deploy frontend
echo -e "${GREEN}📦 Deploying frontend service...${NC}"
kubectl set image deployment/frontend \
    frontend=ghcr.io/${GITHUB_REPOSITORY:-akkolluru/store_provisioning_platform}/frontend:${IMAGE_TAG} \
    -n ${NAMESPACE} || {
    echo -e "${YELLOW}⚠️  Frontend deployment not found, applying manifests...${NC}"
    kubectl apply -f kubernetes/frontend/ -n ${NAMESPACE}
}

# Wait for frontend rollout
echo -e "${GREEN}⏳ Waiting for frontend rollout...${NC}"
kubectl rollout status deployment/frontend -n ${NAMESPACE} --timeout=300s

# Verify deployment health
echo -e "${GREEN}🏥 Verifying deployment health...${NC}"

# Check backend pods
BACKEND_READY=$(kubectl get deployment store-service -n ${NAMESPACE} -o jsonpath='{.status.readyReplicas}')
BACKEND_DESIRED=$(kubectl get deployment store-service -n ${NAMESPACE} -o jsonpath='{.status.replicas}')

if [ "${BACKEND_READY}" == "${BACKEND_DESIRED}" ]; then
    echo -e "${GREEN}✅ Backend healthy: ${BACKEND_READY}/${BACKEND_DESIRED} pods ready${NC}"
else
    echo -e "${RED}❌ Backend unhealthy: ${BACKEND_READY}/${BACKEND_DESIRED} pods ready${NC}"
    exit 1
fi

# Check frontend pods
FRONTEND_READY=$(kubectl get deployment frontend -n ${NAMESPACE} -o jsonpath='{.status.readyReplicas}')
FRONTEND_DESIRED=$(kubectl get deployment frontend -n ${NAMESPACE} -o jsonpath='{.status.replicas}')

if [ "${FRONTEND_READY}" == "${FRONTEND_DESIRED}" ]; then
    echo -e "${GREEN}✅ Frontend healthy: ${FRONTEND_READY}/${FRONTEND_DESIRED} pods ready${NC}"
else
    echo -e "${RED}❌ Frontend unhealthy: ${FRONTEND_READY}/${FRONTEND_DESIRED} pods ready${NC}"
    exit 1
fi

# Display deployed versions
echo ""
echo -e "${GREEN}📊 Deployment Summary:${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Namespace: ${NAMESPACE}"
echo "Backend Image: ghcr.io/\${GITHUB_REPOSITORY}/backend:${IMAGE_TAG}"
echo "Frontend Image: ghcr.io/\${GITHUB_REPOSITORY}/frontend:${IMAGE_TAG}"
echo ""
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
