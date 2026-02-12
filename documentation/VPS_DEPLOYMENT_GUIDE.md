# VPS Production Deployment Guide

> Complete guide to deploying the Store Provisioning Platform on a production VPS using k3s.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [VPS Setup](#vps-setup)
- [Install k3s](#install-k3s)
- [Install Helm](#install-helm)
- [Configure DNS](#configure-dns)
- [Install NGINX Ingress Controller](#install-nginx-ingress-controller)
- [Install cert-manager (TLS/HTTPS)](#install-cert-manager-tlshttps)
- [Deploy PostgreSQL](#deploy-postgresql)
- [Deploy the Backend](#deploy-the-backend)
- [Deploy the Frontend](#deploy-the-frontend)
- [Create Your First Store](#create-your-first-store)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| **VPS Provider** | Any (DigitalOcean, Hetzner, Linode, AWS EC2) | DigitalOcean or Hetzner |
| **CPU** | 2 cores | 4 cores |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 40 GB SSD | 80 GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| **Domain** | Yes (e.g., `yourdomain.com`) | With wildcard DNS |
| **SSH Access** | Root or sudo user | Root or sudo user |

---

## VPS Setup

### Step 1: Provision a VPS

Choose a provider and create a VPS with Ubuntu 22.04 LTS. Example providers:

- **DigitalOcean**: $24/month for 4GB RAM, 2 vCPUs
- **Hetzner**: €9.50/month for 4GB RAM, 2 vCPUs
- **Linode**: $24/month for 4GB RAM, 2 vCPUs

### Step 2: Initial Server Configuration

SSH into your VPS:

```bash
ssh root@<your-vps-ip>
```

Update the system:

```bash
apt update && apt upgrade -y
```

Install essential tools:

```bash
apt install -y curl wget git vim ufw
```

Configure firewall:

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow k3s API (if you need external kubectl access)
ufw allow 6443/tcp

# Enable firewall
ufw --force enable
```

Create a non-root user (optional but recommended):

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

---

## Install k3s

k3s is a lightweight Kubernetes distribution perfect for VPS deployments.

### Install k3s

```bash
curl -sfL https://get.k3s.io | sh -
```

This installs k3s and starts it automatically.

### Verify Installation

```bash
sudo k3s kubectl get nodes
```

You should see:

```
NAME        STATUS   ROLES                  AGE   VERSION
your-vps    Ready    control-plane,master   1m    v1.28.x+k3s1
```

### Configure kubectl (Optional)

To use `kubectl` without `sudo`:

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $USER:$USER ~/.kube/config
export KUBECONFIG=~/.kube/config

# Add to ~/.bashrc for persistence
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
```

Now you can use `kubectl` instead of `sudo k3s kubectl`:

```bash
kubectl get nodes
```

---

## Install Helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

Verify:

```bash
helm version
```

---

## Configure DNS

You need a domain with wildcard DNS pointing to your VPS.

### Option A: Wildcard DNS (Recommended)

Add an A record for your domain:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `*` | `<your-vps-ip>` | 300 |
| A | `@` | `<your-vps-ip>` | 300 |

This allows:
- `app.yourdomain.com` → Your VPS
- `store1.yourdomain.com` → Your VPS
- `store2.yourdomain.com` → Your VPS

### Option B: Individual Subdomains

Add A records for each subdomain:

| Type | Name | Value |
|---|---|---|
| A | `app` | `<your-vps-ip>` |
| A | `store1` | `<your-vps-ip>` |
| A | `store2` | `<your-vps-ip>` |

### Verify DNS

Wait 5-10 minutes for DNS propagation, then test:

```bash
dig app.yourdomain.com +short
# Should return your VPS IP
```

---

## Install NGINX Ingress Controller

k3s comes with Traefik by default, but we'll use NGINX Ingress for consistency with local development.

### Disable Traefik

```bash
sudo systemctl stop k3s
sudo vim /etc/systemd/system/k3s.service

# Add --disable traefik to the ExecStart line:
# ExecStart=/usr/local/bin/k3s server --disable traefik

sudo systemctl daemon-reload
sudo systemctl start k3s
```

### Install NGINX Ingress

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.5/deploy/static/provider/cloud/deploy.yaml
```

Wait for the controller to be ready:

```bash
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

Verify:

```bash
kubectl get pods -n ingress-nginx
```

---

## Install cert-manager (TLS/HTTPS)

cert-manager automates TLS certificate provisioning via Let's Encrypt.

### Install cert-manager

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
```

Wait for cert-manager to be ready:

```bash
kubectl wait --namespace cert-manager \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/instance=cert-manager \
  --timeout=120s
```

### Create Let's Encrypt Issuer

Create `letsencrypt-prod.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # CHANGE THIS
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

Apply it:

```bash
kubectl apply -f letsencrypt-prod.yaml
```

---

## Deploy PostgreSQL

### Option A: Managed Database (Recommended)

Use a managed PostgreSQL service:
- **DigitalOcean Managed Databases**: $15/month
- **AWS RDS**: ~$15/month
- **Supabase**: Free tier available

Skip to [Deploy the Backend](#deploy-the-backend) and use the connection string from your provider.

### Option B: In-Cluster PostgreSQL

Create `postgres-deployment.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: database
---
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: database
type: Opaque
stringData:
  POSTGRES_USER: storeplatform
  POSTGRES_PASSWORD: CHANGE_THIS_PASSWORD  # CHANGE THIS
  POSTGRES_DB: stores
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: database
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: database
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        envFrom:
        - secretRef:
            name: postgres-secret
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: database
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
```

Apply:

```bash
kubectl apply -f postgres-deployment.yaml
```

Run migrations:

```bash
# Copy migration files to the pod
kubectl cp database/migrations/001_create_stores_table.sql database/postgres-<pod-id>:/tmp/
kubectl cp database/migrations/002_create_audit_logs.sql database/postgres-<pod-id>:/tmp/

# Execute migrations
kubectl exec -n database -it postgres-<pod-id> -- psql -U storeplatform -d stores -f /tmp/001_create_stores_table.sql
kubectl exec -n database -it postgres-<pod-id> -- psql -U storeplatform -d stores -f /tmp/002_create_audit_logs.sql
```

---

## Deploy the Backend

### Step 1: Apply RBAC

```bash
kubectl apply -f kubernetes/rbac/
```

### Step 2: Create Backend Secrets

Create `backend-secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: backend-secrets
  namespace: store-platform
type: Opaque
stringData:
  DATABASE_URL: "postgresql://storeplatform:CHANGE_THIS_PASSWORD@postgres.database.svc.cluster.local:5432/stores"
  NODE_ENV: "production"
  PORT: "3000"
```

Apply:

```bash
kubectl apply -f backend-secrets.yaml
```

### Step 3: Build and Push Docker Image

On your local machine:

```bash
# Build the image
docker build -t yourdockerhubusername/store-platform-backend:latest .

# Push to Docker Hub
docker push yourdockerhubusername/store-platform-backend:latest
```

### Step 4: Update Backend Deployment

Edit `kubernetes/backend/deployment.yaml` and update the image:

```yaml
spec:
  containers:
  - name: backend
    image: yourdockerhubusername/store-platform-backend:latest
```

### Step 5: Deploy Backend

```bash
kubectl apply -f kubernetes/backend/
```

Verify:

```bash
kubectl get pods -n store-platform
```

---

## Deploy the Frontend

### Step 1: Build Frontend

On your local machine:

```bash
cd frontend
npm run build
```

### Step 2: Create Frontend Docker Image

Create `frontend/Dockerfile.prod`:

```dockerfile
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend.store-platform.svc.cluster.local:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Build and push:

```bash
cd frontend
docker build -f Dockerfile.prod -t yourdockerhubusername/store-platform-frontend:latest .
docker push yourdockerhubusername/store-platform-frontend:latest
```

### Step 3: Deploy Frontend

Update `kubernetes/frontend/deployment.yaml` with your image, then:

```bash
kubectl apply -f kubernetes/frontend/
```

### Step 4: Create Ingress for Frontend

Create `frontend-ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frontend-ingress
  namespace: store-platform
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.yourdomain.com
    secretName: frontend-tls
  rules:
  - host: app.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

Apply:

```bash
kubectl apply -f frontend-ingress.yaml
```

Wait for TLS certificate:

```bash
kubectl get certificate -n store-platform -w
```

---

## Create Your First Store

1. Open `https://app.yourdomain.com` in your browser
2. Click **"Create Store"**
3. Enter store name: `myshop`
4. Enter subdomain: `myshop`
5. Select engine: **WooCommerce**
6. Click **Submit**

Wait 2-3 minutes for provisioning. Once status shows **Ready**, access your store at:

```
https://myshop.yourdomain.com
```

WP Admin credentials:
- Username: `admin`
- Password: `admin123`

**IMPORTANT**: Change the admin password immediately after first login.

---

## Monitoring & Maintenance

### View Logs

```bash
# Backend logs
kubectl logs -n store-platform -l app=backend --tail=100 -f

# Frontend logs
kubectl logs -n store-platform -l app=frontend --tail=100 -f

# Store logs (replace with actual namespace)
kubectl logs -n store-<uuid> -l app=wordpress --tail=100 -f
```

### Monitor Resources

```bash
# Node resources
kubectl top nodes

# Pod resources
kubectl top pods -A
```

### Backup Database

```bash
# For in-cluster PostgreSQL
kubectl exec -n database postgres-<pod-id> -- pg_dump -U storeplatform stores > backup-$(date +%Y%m%d).sql

# For managed database, use provider's backup tools
```

### Update Application

```bash
# Build new image
docker build -t yourdockerhubusername/store-platform-backend:v1.1.0 .
docker push yourdockerhubusername/store-platform-backend:v1.1.0

# Update deployment
kubectl set image deployment/backend backend=yourdockerhubusername/store-platform-backend:v1.1.0 -n store-platform

# Verify rollout
kubectl rollout status deployment/backend -n store-platform
```

---

## Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace>
```

### TLS Certificate Not Issuing

```bash
# Check certificate status
kubectl describe certificate frontend-tls -n store-platform

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager --tail=100
```

### Store Creation Fails

```bash
# Check backend logs
kubectl logs -n store-platform -l app=backend --tail=100

# Check if Helm is working
helm list -A

# Check RBAC permissions
kubectl auth can-i create namespaces --as=system:serviceaccount:store-platform:store-provisioner
```

### DNS Not Resolving

```bash
# Test DNS from your machine
dig app.yourdomain.com +short

# Test from within cluster
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup app.yourdomain.com
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -A

# Increase resource limits in deployment.yaml
resources:
  limits:
    memory: "2Gi"
    cpu: "1000m"
  requests:
    memory: "512Mi"
    cpu: "250m"
```

---

## Security Checklist

- [ ] Changed default PostgreSQL password
- [ ] Changed WordPress admin password for all stores
- [ ] Enabled UFW firewall
- [ ] TLS/HTTPS enabled via cert-manager
- [ ] RBAC configured with least-privilege
- [ ] NetworkPolicies applied to all store namespaces
- [ ] Regular backups configured
- [ ] Monitoring and alerting set up
- [ ] Rate limiting enabled (already in code)
- [ ] Audit logging enabled (already in code)

---

## Next Steps

- Set up monitoring with Prometheus + Grafana
- Configure automated backups
- Set up log aggregation (e.g., Loki)
- Implement horizontal pod autoscaling (HPA)
- Add a CDN (e.g., Cloudflare) for static assets
- Configure email notifications for store events

---

**Congratulations!** Your Store Provisioning Platform is now running in production. 🎉
