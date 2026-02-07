# WooCommerce Store Helm Chart

## Overview

This Helm chart provisions a complete WooCommerce e-commerce store on Kubernetes with:
- WordPress + WooCommerce
- MySQL 8.0 database
- Persistent storage for database and uploads
- Ingress with optional TLS
- Health checks and resource limits

## Quick Start

### Local Deployment (Minikube)

```bash
# Install a store
helm install store1 ./helm/woocommerce/ \
  --set storeName=store1 \
  --set storeSubdomain=store1 \
  -f helm/woocommerce/values-local.yaml

# Check status
kubectl get pods -n store1

# Get the URL
echo "http://store1.local"
# Add to /etc/hosts: <minikube-ip> store1.local
```

### Production Deployment

```bash
# Install with production values
helm install store1 ./helm/woocommerce/ \
  --set storeName=store1 \
  --set storeSubdomain=store1 \
  --set domain=yourdomain.com \
  -f helm/woocommerce/values-prod.yaml

# Store will be available at: https://store1.yourdomain.com
```

## Configuration

### Key Values

| Parameter | Description | Default |
|-----------|-------------|---------|
| `storeName` | Unique store identifier | `store1` |
| `storeSubdomain` | Subdomain for the store | `store1` |
| `domain` | Base domain | `local` |
| `wordpress.replicas` | Number of WordPress pods | `1` |
| `mysql.persistence.size` | MySQL storage size | `5Gi` |
| `ingress.enabled` | Enable Ingress | `true` |
| `ingress.tls.enabled` | Enable TLS/HTTPS | `false` |

### Values Files

- **values.yaml**: Default values
- **values-local.yaml**: Local development (Minikube/Kind)
- **values-prod.yaml**: Production VPS/Cloud

## Architecture

```
┌─────────────────┐
│    Ingress      │  (store1.local)
└────────┬────────┘
         │
    ┌────▼─────┐
    │ WordPress│  (Deployment, 1-2 replicas)
    │ Service  │
    └────┬─────┘
         │
    ┌────▼─────┐
    │  MySQL   │  (StatefulSet, 1 replica)
    │ Service  │
    └────┬─────┘
         │
    ┌────▼─────┐
    │   PVCs   │  (Persistent storage)
    └──────────┘
```

## Components

### MySQL
- StatefulSet with 1 replica
- Persistent storage via PVC
- Random password generation
- Health checks

### WordPress
- Deployment with configurable replicas
- Init container waits for MySQL
- Persistent storage for uploads/plugins
- Environment variables for DB connection

### Ingress
- Exposes store via subdomain
- Optional TLS with cert-manager
- Configurable annotations

## Uninstalling

```bash
# Delete the Helm release
helm uninstall store1

# Clean up namespace (if needed)
kubectl delete namespace store1
```

## Troubleshooting

### Check pod status
```bash
kubectl get pods -n store1
kubectl logs -n store1 <pod-name>
```

### Check PVCs
```bash
kubectl get pvc -n store1
```

### Check Ingress
```bash
kubectl get ingress -n store1
```

### Access WordPress directly
```bash
kubectl port-forward -n store1 svc/store1-wordpress 8080:80
# Visit http://localhost:8080
```

## Customization

### Custom WordPress plugins
Mount a ConfigMap with plugin files via volumeMounts in `wordpress-deployment.yaml`.

### Resource limits
Adjust in values files:
```yaml
wordpress:
  resources:
    requests:
      cpu: 200m
      memory: 512Mi
```

## Security

- Passwords auto-generated via Helm secrets
- Non-root security context (where possible)
- Network policies (recommended, not included)
- Resource quotas (recommended, not included)
