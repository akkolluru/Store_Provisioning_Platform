# Store Provisioning Platform - Comprehensive Technical Guide

This document serves as the complete technical reference for the Store Provisioning Platform. It details the architecture, implementation methodology, and provides a file-by-file breakdown of the codebase.

---

## 1. Project Requirements & Capabilities

The platform is designed to provide **multi-tenant e-commerce store provisioning** on Kubernetes.

### Core Capabilities
1.  **Automated Provisioning**: Deploys fully functional WooCommerce stores with a single API call.
2.  **Resource Isolation**: Each store runs in a dedicated Kubernetes namespace (`store-<uuid>`).
3.  **Persistent Storage**:
    *   **WordPress**: Dedicated PersistentVolumeClaim (PVC) for file storage.
    *   **Database**: Dedicated MySQL pod and PVC per store.
4.  **Networking**:
    *   **Local**: NodePort access (IP-based) for immediate accessibility without DNS.
    *   **Production**: Ingress-based routing with subdomains.
5.  **Lifecycle Management**:
    *   **Create**: Initial deployment and DB setup.
    *   **List**: View all active stores.
    *   **Delete**: Full decommission (Helm uninstall + Namespace deletion).
6.  **Security & Reliability**:
    *   Rate limiting (Create: 5/15min, General: 100/1min).
    *   Audit logging.
    *   Vault integration for secrets.
    *   Optimistic locking for updates.

---

## 2. Implementation Methodology

We adopted an **Incremental, Component-Based Architecture**:

1.  **Foundation (Kubernetes & Helm)**:
    *   We started by defining the logic in **Helm Charts**. This ensures that the infrastructure logic (Deployment, Service, PVC) is version-controlled and decoupled from the application code.
    *   *Key Decision*: Use a standard WooCommerce chart structure but highly customized for multi-tenancy.

2.  **Backend Core (Express + TypeScript)**:
    *   Built a stateless REST API that strictly acts as an orchestrator.
    *   *Key Decision*: The backend does *not* manage pods directly. It delegates everything to **Helm** via the `HelmService`.

3.  **Database Integration (PostgreSQL)**:
    *   Used for tracking store metadata (ID, status, version, config), NOT for store data itself (each store has its own MySQL).
    *   *Key Decision*: Use a connection pool singleton to manage resources efficiently.

4.  **Networking Evolution (The ".local" vs NodePort Fix)**:
    *   **Initial Approach**: Used `.local` domains with Ingress.
        *   *Problem*: Required manual `/etc/hosts` updates on the developer machine for every new store.
    *   **Final Solution**: Implemented **NodePort Discovery**.
        *   *Implementation*: The backend queries Kubernetes for the assigned NodePort and Minikube IP.
        *   *Result*: `http://192.168.49.2:32001` - Works immediately, zero manual config.

---

## 3. Project Structure & File-by-File Analysis

### A. Backend Services (`src/`)

#### 1. Entry Point & Configuration
*   **`src/store-service/app.ts`**
    *   **Purpose**: Main application entry point.
    *   **Functionality**:
        *   Initializes Express app.
        *   Sets up global middleware (Rate Limiting, Audit Logger, Request ID).
        *   Loads configuration from **Vault** (with env var fallback).
        *   Defines core endpoints (`/health`, `/ready`, `/`).
        *   Mounts the `storesRouter`.

#### 2. Services (The Logic Layer)
*   **`src/shared/services/helm-service.ts`** (CRITICAL FILE)
    *   **Purpose**: Wrapper around Helm CLI commands.
    *   **Key Methods**:
        *   `installStore()`: Executes `helm install` with `--namespace <store>` and `--create-namespace`. This ensures isolation.
        *   `uninstallStore()`: Executes `helm uninstall --namespace <store>` followed by `kubectl delete namespace`.
        *   `generateStoreUrl()`: PROVISIONING FIX. Detects if running locally, finds the NodePort and Minikube IP to return a working URL.
*   **`src/shared/services/vault-service.ts`**
    *   **Purpose**: Secure secret management.
    *   **Functionality**: Connects to HashiCorp Vault to read database credentials and configuration.
*   **`src/shared/services/audit-logger.ts`**
    *   **Purpose**: Compliance and tracking.
    *   **Functionality**: structured logging of all sensitive operations.

#### 3. Routes & Controllers
*   **`src/store-service/routes/stores.ts`**
    *   **Purpose**: API endpoints for store management.
    *   **Endpoints**:
        *   `POST /stores`: Validates input, creates DB record (`PROVISIONING` status), triggers `HelmService.installStore()` asynchronously.
        *   `DELETE /stores/:id`: validation, triggers `HelmService.uninstallStore()`, soft-deletes in DB (`DECOMMISSIONED`).
        *   `GET /stores`: Lists active stores (replica read).
*   **`src/store-service/models/store.ts`**
    *   **Purpose**: Data validation.
    *   **Functionality**: Joi schemas for `createStoreSchema` and `updateStoreSchema`.

#### 4. Shared Infrastructure
*   **`src/shared/database/db-instance.ts`**
    *   **Purpose**: Database Singleton.
    *   **Functionality**: Ensures a single `DatabaseConnectionManager` pool is shared across the entire app.
*   **`src/shared/database/connection-manager.ts`**
    *   **Purpose**: Low-level PG connection logic.
    *   **Functionality**: Handles pool creation, idle timeouts, and query execution.
*   **`src/shared/middleware/rate-limiter.middleware.ts`**
    *   **Purpose**: API Security.
    *   **Functionality**: Defines `createStoreRateLimiter` (strict) and `generalApiRateLimiter` (lenient).

### B. Helm Charts (`helm/`)

This directory contains the Infrastructure-as-Code (IaC) templates used to deploy each store.

#### `helm/woocommerce/`
*   **`Chart.yaml`**: Metadata (version 1.0.0).
*   **`values.yaml`**: **Default Production Values**.
    *   `service.type`: ClusterIP.
    *   `ingress.enabled`: true.
*   **`values-local.yaml`**: **Local Development Overrides**.
    *   `service.type`: NodePort (Crucial for the local access fix).
    *   `ingress`: Enabled but not used for primary access.
    *   `persistence.size`: Reduced to 2Gi.

#### Templates (`helm/woocommerce/templates/`)
*   **`namespace.yaml`**: Ensures namespace exists (redundant with `--create-namespace` but good practice).
*   **`wordpress-deployment.yaml`**: The main application pod specification.
*   **`mysql-statefulset.yaml`**: Database pod specification.
*   **`wordpress-service.yaml`**:
    *   Exposes the pod.
    *   Type is dynamic: `{{ .Values.service.type }}` (NodePort vs ClusterIP).
*   **`ingress.yaml`**: Ingress rules for domain-based routing (`store.domain.com`).
*   **`pvc.yaml`**: PersistentVolumeClaims for data persistence.
*   **`limitrange.yaml`** & **`resourcequota.yaml`**: Safety limits to prevent one store from consuming all cluster resources.

### C. Scripts (`scripts/`)
These are helper utilities for operations.

*   **`scripts/configure-store-dns.sh`**: (Deprecated workflow) Helper to add entries to `/etc/hosts`. Not strictly needed with the NodePort fix but useful for testing Ingress.
*   **`scripts/cleanup-store-dns.sh`**: Removes entries from `/etc/hosts`.
*   **`scripts/start-tunnel.sh`**: Helper for Minikube tunnel (needed for Ingress LoadBalancer).

---

## 4. Known Issues & Solutions

### Issue: Store URLs Not Accessible (`.local`)
*   **Description**: Browsers cannot resolve `store.local` domains without manual local DNS config.
*   **Solution**: Implemented `generateStoreUrl` in `helm-service.ts`.
*   **Logic**:
    *   If environment is `local`:
    *   Run `kubectl get service ... -o jsonpath={.spec.ports[0].nodePort}`
    *   Run `minikube ip`
    *   Construct URL: `http://IP:PORT`
*   **Status**: **FIXED**.

### Issue: Stores Installing to Wrong Namespace
*   **Description**: Stores were all deploying to `store-platform` (the backend's namespace).
*   **Cause**: `helm install` command lacked namespace scope.
*   **Solution**: Added `--namespace <store-name> --create-namespace` to `helm-service.ts`.
*   **Status**: **FIXED**.
