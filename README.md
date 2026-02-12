# Store Provisioning Platform

> Automated WooCommerce store provisioning on Kubernetes — from one-click creation to full lifecycle management.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start (Local)](#quick-start-local)
- [Creating a Store & Placing an Order](#creating-a-store--placing-an-order)
- [API Reference](#api-reference)
- [Helm Charts](#helm-charts)
- [Security](#security)
- [Production Deployment (VPS / k3s)](#production-deployment-vps--k3s)
- [System Design Notes](#system-design-notes)
- [Project Structure](#project-structure)
- [Development](#development)

---

## Overview

The Store Provisioning Platform automates the deployment of isolated WooCommerce stores on Kubernetes. Each store gets its own namespace, database, persistent storage, Ingress route, and network isolation — all provisioned via a single API call.

### What It Does

1. **One-click store creation** — Click "Create Store" in the dashboard, get a fully functional WooCommerce shop.
2. **Automatic setup** — WordPress, WooCommerce, and Storefront theme are installed automatically. No manual setup required.
3. **Namespace isolation** — Each store runs in its own Kubernetes namespace with ResourceQuotas, LimitRanges, and NetworkPolicies.
4. **Lifecycle management** — Create, monitor, and delete stores. Deletion cleans up all resources (Helm release, namespace, PVCs).
5. **Same charts, any environment** — Runs on Minikube locally and k3s/cloud in production with only `values-*.yaml` changes.

### Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Material-UI, Vite |
| **Backend** | Node.js, Express, TypeScript (strict mode) |
| **Database** | PostgreSQL 14+ |
| **Orchestration** | Kubernetes, Helm 3 |
| **Store Engine** | WordPress 6.9.1 + WooCommerce 10.5.1 |
| **Ingress** | NGINX Ingress Controller |
| **Security** | RBAC, NetworkPolicies, rate limiting, input sanitization |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│                      http://localhost:4000                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                    │
│  Dashboard │ Store List │ Create Store Wizard │ Metrics      │
└──────────────────────────┬───────────────────────────────────┘
                           │  /api/*  (Vite proxy)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                   BACKEND (Express API)                      │
│                    http://localhost:3000                      │
│                                                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Rate       │  │  Input       │  │  Audit Logger        │ │
│  │  Limiter    │  │  Sanitizer   │  │  (who did what)      │ │
│  └────────────┘  └──────────────┘  └──────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────────┐   │
│  │                  Helm Service                         │   │
│  │  installStore() │ uninstallStore() │ getStatus()      │   │
│  └────────────────────────┬─────────────────────────────┘   │
└───────────────────────────┼──────────────────────────────────┘
                            │  helm install / uninstall
           ┌────────────────▼────────────────┐
           │        KUBERNETES CLUSTER       │
           │                                 │
           │  ┌──────────────────────────┐   │
           │  │  Namespace: store-<uuid> │   │
           │  │  ┌────────┐ ┌─────────┐  │   │
           │  │  │WordPress│ │  MySQL  │  │   │
           │  │  │  6.9.1  │ │  8.0    │  │   │
           │  │  │+WooCom. │ │         │  │   │
           │  │  └────────┘ └─────────┘  │   │
           │  │  ┌────────┐ ┌─────────┐  │   │
           │  │  │Ingress │ │ Network │  │   │
           │  │  │<sub>.  │ │ Policy  │  │   │
           │  │  │ local  │ │(isolate)│  │   │
           │  │  └────────┘ └─────────┘  │   │
           │  │  ResourceQuota │ LimitRange │ │
           │  └──────────────────────────┘   │
           │                                 │
           │  (Repeated per store)           │
           └─────────────────────────────────┘
```

**Key design decisions:**
- **Namespace-per-store** — Each store is fully isolated. No cross-store network access by default.
- **Async provisioning** — The API returns `201 PROVISIONING` immediately; Helm install runs in the background and updates the DB status to `ready` or `failed`.
- **Helm-only deployment** — No Kustomize. All config differences (local vs. prod) live in `values-*.yaml`.

---

## Quick Start (Local)

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | 20+ | Backend + Frontend |
| **Docker Desktop** | Latest | Container runtime |
| **Minikube** | Latest | Local Kubernetes cluster |
| **Helm** | 3.x | Chart deployment |
| **PostgreSQL** | 14+ | Store metadata DB |

### Step 1: Clone & Install

```bash
git clone <repository-url>
cd Store_Provisioning_Platform

# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install && cd ..
```

### Step 2: Start Infrastructure

```bash
# Start Minikube
minikube start --memory=4096 --cpus=2

# Enable NGINX Ingress controller
minikube addons enable ingress

# Start Minikube tunnel (keep this running in a separate terminal)
# This assigns 127.0.0.1 to LoadBalancer services
minikube tunnel
```

### Step 3: Patch Ingress Controller

```bash
# Change Ingress controller to LoadBalancer so minikube tunnel works
kubectl patch svc ingress-nginx-controller -n ingress-nginx \
  -p '{"spec": {"type": "LoadBalancer"}}'
```

### Step 4: Set Up the Database

```bash
# Create the stores table
psql -U <your-user> -d postgres -f database/migrations/001_create_stores_table.sql
psql -U <your-user> -d postgres -f database/migrations/002_create_audit_logs.sql
```

### Step 5: Apply RBAC

```bash
kubectl apply -f kubernetes/rbac/
```

### Step 6: Start the Application

```bash
# Terminal 1: Backend
npm run dev
# Starts on http://localhost:3000

# Terminal 2: Frontend
cd frontend && npm run dev
# Starts on http://localhost:4000
```

### Step 7: Open the Dashboard

Navigate to **http://localhost:4000** in your browser. You should see the Store Provisioning Dashboard.

---

## Creating a Store & Placing an Order

### 1. Create a Store

- Open the dashboard at `http://localhost:4000`
- Click **"Create Store"**
- Enter a store name (e.g., `myshop`) and subdomain
- Select the WooCommerce engine
- Click **Submit**

The store status will change: `Provisioning` → `Ready` (takes 2-5 minutes on first run due to Docker image pulls).

### 2. Access the Store

Once the store status shows **Ready**, the store URL will appear (e.g., `http://myshop.local`).

**Add the DNS entry** (required for local development):
```bash
echo '127.0.0.1  myshop.local  # store-provisioning-platform' | sudo tee -a /etc/hosts
```

Open `http://myshop.local` in your browser — you'll see the WooCommerce Storefront.

### 3. Place a Test Order

1. Browse the store and **add a product to the cart**
2. Go to **Checkout**
3. Fill in test details and select **"Cash on Delivery"** as the payment method
4. Click **Place Order**

### 4. Confirm the Order in WP Admin

1. Go to `http://myshop.local/wp-admin`
2. Login with `admin` / `admin123`
3. Navigate to **WooCommerce → Orders**
4. Verify the order exists

### 5. Delete a Store

- In the dashboard, click the **delete button** next to the store
- Confirm deletion
- All resources (Helm release, namespace, PVCs) are cleaned up automatically

---

## API Reference

Base URL: `http://localhost:3000/api`

### Health Checks

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Service health status |
| `/ready` | GET | Readiness check |

### Store Management

#### List All Stores

```
GET /api/stores
```

**Response** `200 OK`:
```json
{
  "stores": [
    {
      "id": "f555bec2-fd29-40c9-8176-d5b9902fb44d",
      "name": "myshop",
      "status": "ready",
      "engine": "woocommerce",
      "url": "http://myshop.local",
      "namespace": "store-f555bec2-fd29-40c9-8176-d5b9902fb44d",
      "config": { "engine": "woocommerce", "subdomain": "myshop" },
      "version": 1,
      "created_at": "2026-02-11T17:25:12.543Z",
      "updated_at": "2026-02-11T17:25:56.774Z"
    }
  ],
  "count": 1
}
```

#### Get Single Store

```
GET /api/stores/:id
```

**Response** `200 OK`: Single store object.
**Response** `404 Not Found`: `{ "error": "NOT_FOUND" }`

#### Create Store

```
POST /api/stores
Content-Type: application/json
```

**Request body**:
```json
{
  "name": "myshop",
  "config": {
    "engine": "woocommerce",
    "subdomain": "myshop"
  }
}
```

**Response** `201 Created`:
```json
{
  "store": {
    "id": "f555bec2-...",
    "name": "myshop",
    "status": "provisioning",
    "url": null,
    "namespace": null
  },
  "message": "Store provisioning initiated. Check status for updates."
}
```

**Rate limit**: 5 stores per 15 minutes per IP.
**Quota**: Configurable maximum active stores.

#### Update Store

```
PUT /api/stores/:id
Content-Type: application/json
```

**Request body** (optimistic locking via `version`):
```json
{
  "name": "Updated Name",
  "version": 1
}
```

**Response** `200 OK`: Updated store object.
**Response** `409 Conflict`: Version mismatch (concurrent modification).

#### Delete Store

```
DELETE /api/stores/:id
```

**Response** `200 OK`:
```json
{
  "message": "Store deleted successfully",
  "store": { ... }
}
```

Deleting a store:
1. Uninstalls the Helm release
2. Deletes the Kubernetes namespace (and all resources within it)
3. Marks the database record as `decommissioned`

---

## Helm Charts

### Chart Structure

```
helm/woocommerce/
├── Chart.yaml                              # Chart metadata (appVersion: 6.9.1)
├── values.yaml                             # Default values
├── values-local.yaml                       # Local overrides (Minikube)
├── values-prod.yaml                        # Production overrides (VPS/Cloud)
└── templates/
    ├── namespace.yaml                      # Store namespace
    ├── secret.yaml                         # MySQL credentials
    ├── pvc.yaml                            # Persistent volumes (WordPress + MySQL)
    ├── mysql-statefulset.yaml              # MySQL 8.0 StatefulSet
    ├── mysql-service.yaml                  # MySQL ClusterIP service
    ├── wordpress-deployment.yaml           # WordPress 6.9.1 Deployment
    ├── wordpress-service.yaml              # WordPress service
    ├── setup-woocommerce-configmap.yaml    # Auto-setup script (WP-CLI + WooCommerce)
    ├── ingress.yaml                        # NGINX Ingress rule
    ├── networkpolicy.yaml                  # Network isolation
    ├── resourcequota.yaml                  # Resource limits per namespace
    └── limitrange.yaml                     # Default container limits
```

### Local vs. Production Differences

| Setting | `values-local.yaml` | `values-prod.yaml` |
|---|---|---|
| **Domain** | `local` | `yourdomain.com` |
| **Storage class** | `standard` (Minikube) | `do-block-storage` (cloud) |
| **Storage size** | 2Gi | 10Gi |
| **WordPress replicas** | 1 | 2 (HA) |
| **TLS** | Disabled | Enabled (cert-manager) |
| **CPU requests** | 100m | 500m |
| **Memory requests** | 256Mi | 512Mi |
| **Ingress body size** | 50m | 100m |

### WooCommerce Auto-Setup

The `setup-woocommerce-configmap.yaml` contains a script that runs automatically via a `postStart` lifecycle hook:

1. Waits for WordPress files and database connection
2. Downloads and installs WP-CLI
3. Runs `wp core install` (creates admin user: `admin` / `admin123`)
4. Installs and activates WooCommerce plugin (latest version)
5. Installs and activates Storefront theme
6. Configures permalinks (`/%postname%/`)
7. Writes a marker file to prevent re-running on pod restarts

---

## Security

### RBAC (Least-Privilege Access)

The provisioning service uses a dedicated `store-provisioner` ServiceAccount with a ClusterRole granting only the permissions needed:

**Allowed**:
- Create/delete namespaces (for store isolation)
- Manage deployments, services, PVCs, ingress (for store resources)
- Apply NetworkPolicies, ResourceQuotas, LimitRanges
- Read pods and events (for health checks and debugging)

**Denied**:
- Node management
- Cluster-admin operations
- Access to other services' namespaces

```bash
# Verify permissions
kubectl auth can-i create namespaces \
  --as=system:serviceaccount:store-platform:store-provisioner
# yes

kubectl auth can-i delete nodes \
  --as=system:serviceaccount:store-platform:store-provisioner
# no
```

### Network Isolation

Each store namespace has a `NetworkPolicy` that:
- **Denies all ingress** except from the NGINX Ingress controller
- **Denies all egress** except DNS (port 53), HTTPS (port 443), and intra-namespace communication
- **No cross-store traffic** — Store A cannot reach Store B

### Rate Limiting & Abuse Prevention

| Middleware | Limit | Scope |
|---|---|---|
| `createStoreRateLimiter` | 5 stores / 15 min | Per IP |
| `storeQuotaChecker` | Configurable max active stores | Global |
| `generalApiRateLimiter` | 100 requests / 15 min | Per IP |
| `deleteStoreRateLimiter` | 10 deletes / 15 min | Per IP |

### Input Sanitization

All user input is sanitized through:
- **DOMPurify** — Strips XSS vectors (HTML, scripts)
- **validator.js** — Validates formats, blocks SQL injection patterns
- **Joi schemas** — Validates request body structure and types

### Audit Logging

All store lifecycle events (create, update, delete) are logged to the `audit_logs` table:
```sql
-- Fields: id, action, entity_type, entity_id, actor, details, timestamp
SELECT * FROM audit_logs ORDER BY created_at DESC;
```

---

## Production Deployment (VPS / k3s)

### What Changes for Production

The same Helm charts are used — only the values file changes. Key differences:

```bash
# Local (Minikube)
helm install store-xxx ./helm/woocommerce \
  -f ./helm/woocommerce/values-local.yaml

# Production (k3s on VPS)
helm install store-xxx ./helm/woocommerce \
  -f ./helm/woocommerce/values-prod.yaml \
  --set domain=yourdomain.com
```

### Configuration Changes Required

| Component | Local | Production |
|---|---|---|
| **DNS** | `/etc/hosts` entries | Real DNS records (A/CNAME) |
| **Domain** | `*.local` | `*.yourdomain.com` |
| **TLS** | None | cert-manager + Let's Encrypt |
| **Storage** | Minikube `standard` | Cloud block storage |
| **Ingress** | Minikube tunnel | Cloud LoadBalancer / NodePort |
| **Database** | Local PostgreSQL | Managed DB (RDS, Cloud SQL) or in-cluster |
| **Secrets** | Local .env | Kubernetes Secrets / Vault |

### High-Level Steps

1. **Provision a VPS** (e.g. DigitalOcean, Hetzner, AWS EC2)
2. **Install k3s**: `curl -sfL https://get.k3s.io | sh -`
3. **Install Helm**: `curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash`
4. **Set up NGINX Ingress + cert-manager** for TLS
5. **Point DNS** `*.yourdomain.com` → VPS IP
6. **Deploy PostgreSQL** (managed or in-cluster)
7. **Deploy the backend** with production environment variables
8. **Create stores** using `values-prod.yaml`

---

## System Design Notes

### Idempotency

- **Helm `releaseExists()` check** — Before installing, the service checks if a release already exists. Duplicate creation requests return an error instead of creating orphaned resources.
- **Optimistic locking** — Store updates use a `version` field. Concurrent modifications are rejected with a `409 Conflict` instead of silently overwriting.

### Failure Handling & Cleanup

- **Async provisioning** — The API returns `201 PROVISIONING` immediately. If Helm install fails, the store status is updated to `failed` in the database.
- **Automatic cleanup on failure** — If `installStore()` throws, the catch block attempts `uninstallStore()` to clean up any partial resources.
- **Safe deletion** — `DELETE /api/stores/:id` first uninstalls the Helm release and namespace, then updates the database record. If Helm uninstall fails, the database update still proceeds.

### Recovery on Restart

- **Source of truth is the database** — Store status is persisted in PostgreSQL. If the backend restarts mid-provisioning, stores stuck in `provisioning` status can be detected and re-checked via `getStoreStatus()`.
- **Helm is declarative** — Re-running `helm install` on an existing release is idempotent (it errors gracefully, not destructively).

### Scalability Considerations

- **Concurrent provisioning** — Multiple stores can be provisioned simultaneously since each runs in its own namespace and Helm install is async.
- **ResourceQuotas** — Each store namespace has CPU/memory limits to prevent any single store from consuming cluster resources.
- **Horizontal scaling** — The backend is stateless (state lives in PostgreSQL). Multiple backend replicas can run behind a load balancer.

---

## Project Structure

```
Store_Provisioning_Platform/
├── src/                                    # Backend source code
│   ├── store-service/
│   │   ├── app.ts                          # Express application setup
│   │   ├── routes/stores.ts                # REST API endpoints
│   │   └── models/store.ts                 # Data models & Joi schemas
│   └── shared/
│       ├── services/
│       │   ├── helm-service.ts             # Helm orchestration (install/uninstall/status)
│       │   ├── audit-logger.ts             # Audit log service
│       │   └── vault-service.ts            # Vault integration (optional)
│       ├── database/
│       │   ├── db-instance.ts              # Database connection singleton
│       │   └── connection-manager.ts       # Connection pooling & failover
│       └── middleware/
│           ├── rate-limiter.middleware.ts   # Rate limiting & store quotas
│           └── circuit-breaker.middleware.ts
├── frontend/                               # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx               # Metrics overview
│   │   │   ├── StoreList.tsx               # Store list with CRUD
│   │   │   └── StoreWizard.tsx             # Store creation wizard
│   │   ├── services/
│   │   │   ├── api.ts                      # Axios instance
│   │   │   └── storeApi.ts                 # Store API client
│   │   └── components/                     # Reusable UI components
│   └── vite.config.ts                      # Vite config (port 4000, API proxy)
├── helm/
│   └── woocommerce/                        # WooCommerce Helm chart
│       ├── Chart.yaml
│       ├── values.yaml                     # Default values
│       ├── values-local.yaml               # Local (Minikube) overrides
│       ├── values-prod.yaml                # Production (VPS) overrides
│       └── templates/                      # Kubernetes manifest templates
├── kubernetes/
│   ├── rbac/                               # RBAC manifests
│   │   ├── namespace.yaml                  # store-platform namespace
│   │   └── store-provisioner-rbac.yaml     # ServiceAccount, ClusterRole, Binding
│   ├── backend/                            # Backend K8s deployment
│   ├── frontend/                           # Frontend K8s deployment
│   └── isolation/                          # ResourceQuota & NetworkPolicy templates
├── database/
│   └── migrations/
│       ├── 001_create_stores_table.sql
│       └── 002_create_audit_logs.sql
├── scripts/                                # Helper scripts
│   ├── configure-store-dns.sh              # Auto-configure /etc/hosts
│   └── deploy.sh                           # Deployment script
└── package.json
```

---

## Development

### Build & Test

```bash
# TypeScript compilation check
npx tsc --noEmit

# Run tests
npm test

# Lint
npm run lint

# Build for production
npm run build
```

### Code Standards

- **TypeScript strict mode** — No implicit `any`, strict null checks
- **Early returns** — Guard clauses instead of nested if/else
- **Exhaustive error handling** — All async operations have try/catch
- **Conventional commits** — `feat:`, `fix:`, `docs:` prefixes
- **Input validation** — All API inputs validated via Joi schemas and sanitized

### Git Workflow

```bash
# Atomic commits for each change
git add <files>
git commit -m "feat: description of change"

# Verify before pushing
npx tsc --noEmit && npm test
```

---

## License

MIT
