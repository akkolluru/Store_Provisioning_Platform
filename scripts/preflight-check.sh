#!/bin/bash
# Pre-Flight Checklist Script for WooCommerce Testing
# Run this before following the WooCommerce testing guide

set -e

echo "🚀 Store Provisioning Platform - Pre-Flight Check"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass=0
fail=0

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((pass++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((fail++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check kubectl connection
echo "1. Checking Kubernetes connection..."
if kubectl cluster-info &> /dev/null; then
    check_pass "kubectl connected to cluster"
else
    check_fail "kubectl cannot connect to cluster"
    echo "   → Run: minikube start"
fi

# 2. Check store-platform namespace
echo ""
echo "2. Checking store-platform namespace..."
if kubectl get namespace store-platform &> /dev/null; then
    check_pass "store-platform namespace exists"
else
    check_fail "store-platform namespace missing"
    echo "   → Run: kubectl create namespace store-platform"
fi

# 3. Check PostgreSQL
echo ""
echo "3. Checking PostgreSQL database..."
if kubectl get pods -n store-platform -l app.kubernetes.io/name=postgresql 2>/dev/null | grep -q "Running"; then
    check_pass "PostgreSQL pods running"
    
    # Check if audit_logs table exists
    if kubectl exec -n store-platform postgresql-primary-0 -c postgresql -- \
        sh -c "export PGPASSWORD='store_password_local' && psql -U store_user -d store_db -c '\\dt audit_logs'" 2>/dev/null | grep -q "audit_logs"; then
        check_pass "audit_logs table exists"
    else
        check_warn "audit_logs table not found (Phase 15 migration pending)"
    fi
else
    check_fail "PostgreSQL not running"
    echo "   → Deploy: helm install postgresql bitnami/postgresql -n store-platform -f kubernetes/infrastructure/postgresql-values.yaml"
fi

# 4. Check backend service
echo ""
echo "4. Checking backend service..."
if kubectl get pods -n store-platform -l app=store-service 2>/dev/null | grep -q "Running"; then
    READY=$(kubectl get pods -n store-platform -l app=store-service -o jsonpath='{.items[0].status.containerStatuses[0].ready}')
    if [ "$READY" = "true" ]; then
        check_pass "Backend service running and ready"
    else
        check_warn "Backend service running but not ready"
    fi
else
    check_fail "Backend service not running"
    echo "   → Deploy: kubectl apply -f kubernetes/backend/ -n store-platform"
fi

# 5. Check minikube tunnel
echo ""
echo "5. Checking minikube tunnel (for local access)..."
if pgrep -f "minikube tunnel" > /dev/null; then
    check_pass "minikube tunnel is running"
else
    check_warn "minikube tunnel not detected"
    echo "   → Run in separate terminal: minikube tunnel"
fi

# 6. Check Helm
echo ""
echo "6. Checking Helm installation..."
if command -v helm &> /dev/null; then
    VERSION=$(helm version --short)
    check_pass "Helm installed: $VERSION"
else
    check_fail "Helm not installed"
    echo "   → Install: brew install helm (macOS) or https://helm.sh/docs/intro/install/"
fi

# 7. Check storage class
echo ""
echo "7. Checking storage class..."
if kubectl get storageclass standard &> /dev/null; then
    check_pass "Storage class 'standard' available"
else
    check_warn "Storage class 'standard' not found (may cause PVC issues)"
fi

# 8. Check ingress
echo ""
echo "8. Checking ingress controller..."
if kubectl get pods -n kube-system -l app.kubernetes.io/name=ingress-nginx 2>/dev/null | grep -q "Running"; then
    check_pass "Ingress NGINX controller running"
elif kubectl get pods -n kube-system -l app=traefik 2>/dev/null | grep -q "Running"; then
    check_pass "Traefik ingress controller running (k3s default)"
else
    check_warn "No ingress controller detected"
fi

# 9. Check /etc/hosts (for local testing)
echo ""
echo "9. Checking /etc/hosts configuration..."
if grep -q "\.local" /etc/hosts 2>/dev/null; then
    check_pass "/etc/hosts has local domain entries"
else
    check_warn "/etc/hosts has no .local entries (you'll need to add them per store)"
    echo "   → Add: 127.0.0.1  <subdomain>.local"
fi

# Summary
echo ""
echo "=================================================="
echo "Summary: ${GREEN}${pass} passed${NC}, ${RED}${fail} failed${NC}"
echo ""

if [ $fail -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed! Ready for testing.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start minikube tunnel (if not running): minikube tunnel"
    echo "  2. Port-forward backend: kubectl port-forward -n store-platform svc/store-service 3000:80"
    echo "  3. Follow WooCommerce testing guide"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix issues before testing.${NC}"
    exit 1
fi
