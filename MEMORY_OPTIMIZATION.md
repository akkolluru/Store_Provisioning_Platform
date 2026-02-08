# Memory Optimization Guide

This guide helps you configure Docker Desktop and Kubernetes for minimal memory usage during development.

## Quick Start

For a low-memory development environment:

```bash
# 1. Optimize Minikube (reconfigures to use only 3Gi)
./scripts/optimize-resources.sh

# 2. Set Docker image environment
eval $(minikube docker-env)

# 3. Build images
docker build -t store-service:v1.2.2 .
cd frontend && docker build -t store-frontend:v1.1.1 .

# 4. Start minimal services
./scripts/start-minimal.sh

# 5. In a separate terminal, start tunnel
sudo minikube tunnel
```

## Expected Memory Usage

| Component | Memory | Notes |
|-----------|--------|-------|
| Minikube | 3Gi | Includes k8s control plane |
| PostgreSQL | ~100Mi | Database |
| Backend | 128-256Mi | 1 replica |
| Frontend | 64-128Mi | 1 replica |
| **Total** | **~3.3-3.5Gi** | Plus Docker Desktop overhead |

**Savings vs. default**: ~2-5Gi

## Docker Desktop Settings

Configure Docker Desktop manually via UI (Preferences → Resources):

### Recommended Settings
- **Memory**: 4-5Gi *(reduced from 6-8Gi default)*
- **CPUs**: 2-4
- **Swap**: 1Gi
- **Disk**: 20Gi

### How to Configure
1. Open Docker Desktop
2. Click Settings (gear icon)
3. Navigate to Resources → Advanced
4. Adjust sliders:
   - Memory: Set to 4GB or 5GB
   - CPUs: Set to 2-4
   - Swap: Set to 1GB
5. Click "Apply & Restart"

## What Was Optimized

### 1. Pod Replicas
- Backend: 2 → 1 replica
- Frontend: 2 → 1 replica
- **Savings**: ~320-640Mi

### 2. Resource Limits
Backend (`kubernetes/backend/deployment.yaml`):
```yaml
resources:
  requests:
    cpu: 100m       # was 250m
    memory: 128Mi   # was 256Mi
  limits:
    cpu: 250m       # was 500m
    memory: 256Mi   # was 512Mi
```
- **Savings**: ~128Mi per pod

### 3. Minikube Configuration
```bash
minikube start \
  --cpus=2 \
  --memory=3072 \    # 3Gi instead of 4-6Gi
  --disk-size=15g    # reduced from 20-30g
```
- **Savings**: ~1-3Gi

### 4. Disabled Services
Services skipped in minimal setup:
- Prometheus (monitoring)
- Grafana (dashboards)
- Metrics Server
- HPA (autoscaling)

## Verification

Check resources are applied correctly:

```bash
# Verify Minikube memory
docker inspect minikube --format '{{.HostConfig.Memory}}'
# Should output: 3221225472 (3Gi in bytes)

# Check pod replicas
kubectl get deployments -n store-platform
# Should show DESIRED=1 for all services

# Verify resource limits
kubectl describe pod -n store-platform -l app=store-service | grep -A 5 "Limits:"
# Should show memory: 256Mi

# Check service health
./scripts/preflight-check.sh
```

## Switching Back to Production Config

When you need full resources:

```bash
# Recreate with more resources
minikube delete
minikube start --cpus=4 --memory=8192 --disk-size=30g

# Scale up replicas
kubectl scale deployment store-service --replicas=2 -n store-platform
kubectl scale deployment frontend --replicas=2 -n store-platform
```

Or revert the deployment files manually and redeploy.

## Troubleshooting

### Still Running Out of Memory?

1. **Check actual Docker usage**:
   ```bash
   docker stats --no-stream
   ```

2. **Reduce Minikube further** (2Gi minimum):
   ```bash
   minikube delete
   minikube start --cpus=2 --memory=2048 --disk-size=10g
   ```

3. **Stop unused Docker containers**:
   ```bash
   docker container prune
   docker image prune -a
   ```

4. **Check Docker Desktop allocation**:
   - Ensure it's set to 4-5Gi maximum
   - Restart Docker Desktop

### Services Not Starting?

If pods are OOMKilled or crash looping:
- Check pod logs: `kubectl logs -n store-platform <pod-name>`
- Temporarily increase limits in deployment.yaml
- Ensure database migrations complete before backend starts

### Performance Issues?

Lower resource limits may cause:
- Slower response times
- Longer build times
- Database query timeouts

If this happens, increase memory limits incrementally (e.g., 256Mi → 384Mi).

## Additional Tips

1. **Close unused applications** when running containers
2. **Use `minikube pause`** when not actively developing
3. **Cleanup old images**: `docker system prune`
4. **Monitor system memory**: Activity Monitor (macOS)
5. **Consider switching to k3d** (even lighter than Minikube)

## Files Modified

- [`kubernetes/backend/deployment.yaml`](file:///Users/kaushik/Projects/urumi_ai/Store_Provisioning_Platform/kubernetes/backend/deployment.yaml) - Reduced replicas and limits
- [`kubernetes/frontend/deployment.yaml`](file:///Users/kaushik/Projects/urumi_ai/Store_Provisioning_Platform/kubernetes/frontend/deployment.yaml) - Reduced replicas
- [`scripts/optimize-resources.sh`](file:///Users/kaushik/Projects/urumi_ai/Store_Provisioning_Platform/scripts/optimize-resources.sh) - New Minikube optimizer
- [`scripts/start-minimal.sh`](file:///Users/kaushik/Projects/urumi_ai/Store_Provisioning_Platform/scripts/start-minimal.sh) - Minimal service launcher
