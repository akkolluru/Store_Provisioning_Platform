#!/bin/bash

echo "🔍 Verifying Kubernetes Infrastructure..."
echo ""

# Check namespace
echo "📦 Checking namespace..."
kubectl get namespace store-platform || { echo "❌ Namespace not found!"; exit 1; }
echo "✅ Namespace exists"
echo ""

# Check PostgreSQL
echo "🐘 Checking PostgreSQL..."
POSTGRES_READY=$(kubectl get pods -n store-platform -l app.kubernetes.io/name=postgresql --no-headers 2>/dev/null | grep -c "Running")
if [ "$POSTGRES_READY" -ge 2 ]; then
  echo "✅ PostgreSQL is running ($POSTGRES_READY pods)"
else
  echo "❌ PostgreSQL not ready (expected 2 pods, got $POSTGRES_READY)"
fi
echo ""

# Check Redis
echo "🔴 Checking Redis..."
REDIS_READY=$(kubectl get pods -n store-platform -l app.kubernetes.io/name=redis --no-headers 2>/dev/null | grep -c "Running")
if [ "$REDIS_READY" -ge 1 ]; then
  echo "✅ Redis is running"
else
  echo "❌ Redis not ready"
fi
echo ""

# Check Vault
echo "🔐 Checking Vault..."
VAULT_READY=$(kubectl get pods -n store-platform -l app.kubernetes.io/name=vault --no-headers 2>/dev/null | grep -c "Running")
if [ "$VAULT_READY" -ge 2 ]; then
  echo "✅ Vault is running ($VAULT_READY pods)"
else
  echo "⚠️  Vault partially ready (got $VAULT_READY pods)"
fi
echo ""

# Check Prometheus/Grafana
echo "📊 Checking Monitoring..."
PROMETHEUS_READY=$(kubectl get pods -n store-platform -l app.kubernetes.io/name=prometheus --no-headers 2>/dev/null | grep -c "Running")
GRAFANA_READY=$(kubectl get pods -n store-platform -l app.kubernetes.io/name=grafana --no-headers 2>/dev/null | grep -c "Running")
if [ "$PROMETHEUS_READY" -ge 1 ] && [ "$GRAFANA_READY" -ge 1 ]; then
  echo "✅ Monitoring is running (Prometheus: $PROMETHEUS_READY, Grafana: $GRAFANA_READY)"
else
  echo "⚠️  Monitoring partially ready (Prometheus: $PROMETHEUS_READY, Grafana: $GRAFANA_READY)"
fi
echo ""

echo "🎉 Infrastructure verification complete!"
echo ""
echo "📝 Quick Access Commands:"
echo "  PostgreSQL: kubectl exec -it postgresql-primary-0 -n store-platform -- psql -U store_user -d store_db"
echo "  Redis: kubectl exec -it redis-master-0 -n store-platform -- redis-cli"
echo "  Vault UI: kubectl port-forward -n store-platform svc/vault 8200:8200"
echo "  Grafana: kubectl port-forward -n store-platform svc/prometheus-grafana 3000:80"
echo ""
echo "  Grafana credentials: admin / admin"
