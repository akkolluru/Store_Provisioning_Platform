# Store Provisioning Platform - Complete Project Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Implementation Details](#implementation-details)
6. [Features](#features)
7. [Setup and Deployment](#setup-and-deployment)
8. [Development Guidelines](#development-guidelines)
9. [Troubleshooting](#troubleshooting)

## Overview

The Store Provisioning Platform is an enterprise-grade retail store infrastructure automation platform that automates the complete infrastructure setup for e-commerce stores. It enables rapid deployment of WooCommerce and MedusaJS stores on Kubernetes with production-ready security, scalability, and reliability patterns.

### Key Capabilities
- **Multi-tenant e-commerce store provisioning** on Kubernetes
- **Automated deployment** of fully functional stores with a single API call
- **Resource isolation** with dedicated namespaces per store
- **Persistent storage** for WordPress and database components
- **Networking** with NodePort discovery for local access and Ingress for production
- **Lifecycle management** (create, list, delete stores)
- **Security & Reliability** with rate limiting, audit logging, and Vault integration

## Architecture

### High-Level Architecture
```
┌──────────────────── CLIENT ────────────────────┐
                        │
                        ▼
            ┌─────────────────────┐
            │   Express REST API  │
            │  (Port 3000)        │
            └─────────┬───────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────┐  ┌────────────┐  ┌──────────┐
│  Vault   │  │ PostgreSQL │  │ Circuit  │
│ Service  │  │  Primary   │  │ Breakers │
└──────────┘  └────┬───────┘  └──────────┘
                   │
                   ▼
            ┌──────────────┐
            │  Replica(s)  │
            └──────────────┘
                        │
                        ▼
            ┌─────────────────────┐
            │   Kubernetes        │
            │   Cluster           │
            └─────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Store 1      │ │ Store 2      │ │ Store N      │
│ (Namespace)  │ │ (Namespace)  │ │ (Namespace)  │
│ - WordPress  │ │ - WordPress  │ │ - WordPress  │
│ - Database   │ │ - Database   │ │ - Database   │
│ - PVCs       │ │ - PVCs       │ │ - PVCs       │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Component Architecture
- **Frontend**: React dashboard with Material UI for store management
- **Backend**: Express.js REST API with TypeScript
- **Database**: PostgreSQL for store metadata tracking
- **Secrets**: HashiCorp Vault for secure credential management
- **Orchestration**: Helm for Kubernetes deployments
- **Infrastructure**: Kubernetes cluster with isolated namespaces

## Technology Stack

### Backend Technologies
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3 (Strict Mode)
- **Framework**: Express.js
- **Database**: PostgreSQL 14+ with pg driver
- **Secrets**: HashiCorp Vault
- **Validation**: Joi, Validator.js, DOMPurify
- **Resilience**: Opossum (circuit breakers)
- **Testing**: Jest, ts-jest
- **Linting**: ESLint, Prettier

### Frontend Technologies
- **Framework**: React 19+
- **UI Library**: Material UI (MUI) with Emotion
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **TypeScript**: Strict mode

### Infrastructure Technologies
- **Container Orchestration**: Kubernetes
- **Package Manager**: Helm
- **Container Runtime**: Docker
- **Ingress Controller**: NGINX Ingress Controller
- **Storage**: PersistentVolumeClaims (PVCs)

## System Components

### Backend Services (`src/`)

#### 1. Entry Point & Configuration
- **`src/store-service/app.ts`**: Main application entry point
  - Initializes Express app
  - Sets up global middleware (Rate Limiting, Audit Logger, Request ID)
  - Loads configuration from Vault (with env var fallback)
  - Defines core endpoints (`/health`, `/ready`, `/`)

#### 2. Services (The Logic Layer)
- **`src/shared/services/helm-service.ts`**: Wrapper around Helm CLI commands
  - `installStore()`: Executes `helm install` with `--namespace <store>` and `--create-namespace`
  - `uninstallStore()`: Executes `helm uninstall --namespace <store>` followed by `kubectl delete namespace`
  - `generateStoreUrl()`: NodePort discovery for local access

- **`src/shared/services/vault-service.ts`**: Secure secret management
  - Connects to HashiCorp Vault to read database credentials and configuration
  - Implements circuit breaker pattern for resilience

- **`src/shared/services/audit-logger.ts`**: Compliance and tracking
  - Structured logging of all sensitive operations

#### 3. Routes & Controllers
- **`src/store-service/routes/stores.ts`**: API endpoints for store management
  - `POST /stores`: Validates input, creates DB record, triggers Helm installation
  - `DELETE /stores/:id`: Validation, triggers Helm uninstallation, soft-deletes in DB
  - `GET /stores`: Lists active stores

#### 4. Models & Validation
- **`src/store-service/models/store.ts`**: Data validation with Joi schemas

#### 5. Database Infrastructure
- **`src/shared/database/db-instance.ts`**: Database connection singleton
- **`src/shared/database/connection-manager.ts`**: Low-level PG connection logic with failover

#### 6. Middleware
- **`src/shared/middleware/rate-limiter.middleware.ts`**: API security with rate limiting

### Helm Charts (`helm/`)

#### WooCommerce Chart (`helm/woocommerce/`)
- **`Chart.yaml`**: Metadata (version 1.0.0)
- **`values.yaml`**: Default production values
- **`values-local.yaml`**: Local development overrides
- **`values-prod.yaml`**: Production-specific values

#### Templates
- **`namespace.yaml`**: Ensures namespace exists
- **`wordpress-deployment.yaml`**: WordPress application pod specification
- **`mysql-statefulset.yaml`**: Database pod specification
- **`wordpress-service.yaml`**: Service exposure (NodePort vs ClusterIP)
- **`ingress.yaml`**: Ingress rules for domain-based routing
- **`pvc.yaml`**: PersistentVolumeClaims for data persistence
- **`limitrange.yaml`** & **`resourcequota.yaml`**: Safety limits

#### Medusa Chart (`helm/medusa/`)
- **`Chart.yaml`**: Metadata for Medusa store
- **`values.yaml`**: Default values
- **`values-local.yaml`**: Local development overrides
- **`values-prod.yaml`**: Production-specific values
- **Templates**: Similar to WooCommerce but for MedusaJS

### Frontend Components (`frontend/`)

#### Core Components
- **`App.tsx`**: Main application wrapper with routing
- **`pages/StoreList.tsx`**: Dashboard for managing stores
- **`services/storeApi.ts`**: API client for store operations
- **`services/api.ts`**: Base API configuration

## Implementation Details

### 1. Multi-Tenancy Implementation
Each store runs in a dedicated Kubernetes namespace (`store-<uuid>`) with:
- Isolated resources (pods, services, PVCs)
- Resource quotas and limits
- Network policies for isolation
- Dedicated database and file storage

### 2. NodePort Discovery (Local Access Fix)
The system implements a robust NodePort discovery mechanism:
- Waits for services to be ready before querying NodePort
- Uses minikube IP or node IP for local access
- Constructs accessible URLs like `http://192.168.49.2:3xxxx`
- Includes fallback mechanisms and detailed error reporting

### 3. Engine Support
- **WooCommerce**: Fully implemented with WordPress and MySQL
- **MedusaJS**: Stubbed implementation with PostgreSQL backend
- Architecture supports adding additional engines

### 4. Security Features
- **Vault Integration**: Dynamic secrets with 1-hour lease, encryption-at-rest
- **Input Sanitization**: DOMPurify + Validator.js for XSS/injection prevention
- **Rate Limiting**: Prevents abuse with configurable limits
- **Audit Logging**: Comprehensive logging of all operations
- **Optimistic Locking**: Prevents lost updates in high-concurrency scenarios

### 5. Resilience Patterns
- **Circuit Breakers**: Prevents cascading failures
- **Database Failover**: Automatic primary/replica switching
- **Health Checks**: Continuous monitoring of system components
- **Graceful Degradation**: Fallback mechanisms when services are unavailable

## Features

### Core Functionality
- **Automated Provisioning**: Deploy fully functional stores with a single API call
- **Resource Isolation**: Each store runs in a dedicated namespace
- **Persistent Storage**: Dedicated PVCs for WordPress and database
- **Networking**: NodePort for local access, Ingress for production
- **Lifecycle Management**: Create, list, and delete stores
- **Multi-Engine Support**: WooCommerce and MedusaJS (stubbed)

### Advanced Features
- **Rate Limiting**: Protects against abuse
- **Audit Logging**: Tracks all operations for compliance
- **Vault Integration**: Secure secret management
- **Optimistic Locking**: Concurrency control
- **Health Monitoring**: Built-in health and readiness checks
- **Resource Isolation**: Namespace-per-store with quotas and limits

### Frontend Dashboard
- **Store Listing**: View all stores with status and URLs
- **Store Creation**: Create new stores with engine selection
- **Store Management**: Delete and monitor stores
- **Real-time Updates**: Auto-refresh for provisioning stores

## Setup and Deployment

### Local Development Setup
1. Install prerequisites (Node.js, Docker, kubectl, Helm, Kind/Minikube)
2. Start Kubernetes cluster (Kind recommended)
3. Set up PostgreSQL database
4. Install dependencies and start backend/frontend
5. Create stores via dashboard or API

### Production Deployment
1. Configure production values in `values-prod.yaml`
2. Set up production-grade PostgreSQL
3. Deploy to Kubernetes cluster
4. Configure Ingress with TLS
5. Set up monitoring and alerting

### Environment Configuration
```bash
# Backend environment variables
DATABASE_URL=postgresql://user:pass@host:5432/db
VAULT_ADDR=http://vault:8200
VAULT_TOKEN=your_token

# Frontend environment variables
VITE_API_URL=http://your-backend-domain/api
```

## Development Guidelines

### Code Quality Standards
- TypeScript strict mode with no `any` types
- ESLint with AirBnB style guide
- Prettier for automatic formatting
- Minimum 80% test coverage
- Atomic, conventional commits

### Architecture Principles
- **Incremental Development**: Build one component at a time
- **Fail-Safe**: Circuit breakers and graceful degradation
- **Security First**: Input validation and sanitization
- **Scalability**: Stateless services with horizontal scaling
- **Observability**: Comprehensive logging and metrics

### Git Workflow
1. Create feature branch
2. Make atomic commits following conventional commits
3. Run tests before pushing
4. Create pull request with detailed description
5. Address review comments

## Troubleshooting

### Common Issues
1. **NodePort Discovery**: Service not ready when querying NodePort
2. **Database Connection**: Incorrect connection string or credentials
3. **Helm Installation**: Chart not found or insufficient permissions
4. **Vault Integration**: Connection issues or missing secrets
5. **Kubernetes Access**: RBAC permissions or cluster connectivity

### Debugging Strategies
- Check backend logs for detailed error messages
- Verify Kubernetes resources with `kubectl get all -A`
- Test Helm charts independently with `helm install --dry-run`
- Validate database connectivity separately
- Use `kubectl describe` for detailed resource information

### Monitoring
- Health endpoints: `/health` and `/ready`
- Store status in database and Kubernetes
- Resource utilization in Kubernetes
- API response times and error rates
- Database connection pool metrics

## Conclusion

The Store Provisioning Platform is a comprehensive solution for automated e-commerce store provisioning with enterprise-grade features. It combines modern technologies with proven architectural patterns to deliver a scalable, secure, and reliable platform for multi-tenant store deployments.

The system is designed to be extensible, allowing for additional e-commerce engines and features while maintaining the core principles of security, reliability, and scalability.