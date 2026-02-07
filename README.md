# Store Provisioning Platform

> **Enterprise-grade retail store infrastructure automation platform** with production-ready security, scalability, and reliability patterns.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)]()
[![Test Coverage](https://img.shields.io/badge/coverage-80%25-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## 🎯 Overview

The Store Provisioning Platform automates the complete infrastructure setup for retail stores, including:
- **Hardware provisioning** (POS systems, printers, scanners)
- **Network configuration** (VLAN setup, firewall rules)
- **Software deployment** (applications, updates, configurations)
- **Security management** (credentials, certificates, access control)

### Key Features

✅ **Vault Integration** - Dynamic secrets with 1-hour lease, encryption-at-rest  
✅ **Database Failover** - Automatic primary/replica switching with health checks  
✅ **Circuit Breakers** - Fail-fast & fail-closed patterns for resilience  
✅ **Input Sanitization** - XSS/injection prevention with DOMPurify + Validator.js  
✅ **Optimistic Locking** - Prevents lost updates in high-concurrency scenarios  
✅ **Production-Ready** - Strict TypeScript, 0 lint errors, comprehensive logging  
✅ **CI/CD Pipeline** - Automated testing, building, deployment with GitHub Actions

---

## 🔄 CI/CD Pipeline

### Workflows

- **Backend CI** (`backend-ci.yml`): Runs on PRs
  - TypeScript compilation, linting, tests, build verification

- **Frontend CI** (`frontend-ci.yml`): Runs on PRs  
  - TypeScript compilation, linting, Vite build, Lighthouse testing

- **Backend CD** (`backend-cd.yml`): Runs on merge to main
  - Docker build → Push to `ghcr.io/.../backend:latest`

- **Frontend CD** (`frontend-cd.yml`): Runs on merge to main
  - Docker build → Push to `ghcr.io/.../frontend:latest`

- **Security Scan** (`security-scan.yml`): Weekly + on PRs
  - npm audit, Trivy container scan, CodeQL analysis

### Deployment

```bash
# Deploy latest images
./scripts/deploy.sh development latest

# Deploy specific version  
./scripts/deploy.sh production v1.0.0
```

---

## 🏗️ Architecture

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
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- HashiCorp Vault
- Docker (for local development)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd Store_Provisioning_Platform

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configurations
```

### Local Development

```bash
# Start Vault (Docker)
docker run -d --name=vault \
  -p 8200:8200 \
  --cap-add=IPC_LOCK \
  vault:latest

# Start PostgreSQL (Docker)
docker run -d --name=postgres \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 \
  postgres:14

# Create database schema
psql -h localhost -U postgres -d postgres -c "
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,
  config JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
"

# Set environment variables
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=root
export DATABASE_URL=postgresql://postgres:secret@localhost:5432/postgres

# Start development server
npm run dev
```

Server will start on `http://localhost:3000`

---

## 📡 API Endpoints

### Health Checks

```bash
# Basic health
GET /health
# Response: {"status": "healthy", "service": "store-service"}

# Readiness check
GET /ready
# Response: {"status": "ready"}
```

### Store Management

#### List All Stores
```bash
GET /api/stores

# Response:
{
  "stores": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Downtown Store",
      "status": "ACTIVE",
      "config": {},
      "version": 1
    }
  ],
  "count": 1
}
```

#### Create Store
```bash
POST /api/stores
Content-Type: application/json

{
  "name": "New Store",
  "config": {"region": "US-WEST"}
}

# Response:
{
  "store": {
    "id": "a3bb189e-8bf9-3888-9912-ace4e6543002",
    "name": "New Store",
    "status": "PROVISIONING",
    "version": 1
  },
  "message": "Store created successfully"
}
```

#### Update Store (with Optimistic Locking)
```bash
PUT /api/stores/:id
Content-Type: application/json

{
  "status": "ACTIVE",
  "version": 1  # Required for concurrency control
}

# Success Response:
{
  "store": { ... },
  "message": "Store updated successfully"
}

# Conflict Response (version mismatch):
{
  "error": "CONCURRENCY_ERROR",
  "message": "Store was modified by another request. Please refresh."
}
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Linting
npm run lint
npm run lint:fix
```

---

## 📦 Project Structure

```
Store_Provisioning_Platform/
├── src/
│   ├── shared/
│   │   ├── services/
│   │   │   └── vault-service.ts          # Vault integration with circuit breaker
│   │   ├── database/
│   │   │   └── connection-manager.ts     # DB failover & health checks
│   │   └── middleware/
│   │       └── circuit-breaker.middleware.ts  # Service circuit breakers
│   ├── store-service/
│   │   ├── app.ts                        # Main Express application
│   │   ├── routes/
│   │   │   └── stores.ts                 # REST API endpoints
│   │   └── models/
│   │       └── store.ts                  # Data models & validation
│   └── __tests__/
│       ├── vault-service.test.ts
│       └── integration/
├── documentation/
│   ├── DEVELOPMENT_GUIDE.md              # Comprehensive development guide
│   ├── IMPLEMENTATION_PLAN.md            # Original implementation plan
│   └── TASK_BREAKDOWN.md                 # Phase-by-phase task breakdown
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## 🔒 Security Features

### 1. Secret Management (Vault)
- Dynamic database credentials (auto-expire in 1 hour)
- Encryption-at-rest using Transit engine
- No hardcoded secrets in codebase
- Automatic credential rotation

### 2. Input Validation & Sanitization
- **DOMPurify**: Removes XSS vectors (HTML, scripts)
- **Validator.js**: Prevents SQL injection, validates formats
- **Joi**: Schema validation for API requests
- **Prototype Pollution Protection**: Blocks `__proto__`, `constructor`, `prototype` keys

### 3. Network Security
- TLS enabled for Vault connections
- Restricted PostgreSQL `pg_hba` configuration
- Connection pooling with limits
- Request ID tracing for audit trails

### 4. Operational Security
- **Fail-Closed Pattern**: Security service down = deny all access
- Circuit breakers prevent cascading failures
- Comprehensive error logging (no sensitive data leaks)

---

## 🎛️ Configuration

### Environment Variables

```bash
# Vault Configuration
VAULT_ADDR=http://localhost:8200        # Vault server address
VAULT_TOKEN=root                        # Vault authentication token

# Database Configuration
DATABASE_URL=postgresql://user:pass@host:5432/db  # Primary DB connection
DATABASE_URL_FALLBACK=postgresql://...  # Fallback if Vault unavailable

# Application Configuration
PORT=3000                               # Server port
NODE_ENV=development                    # Environment (development|production)

# Redis Configuration (for circuit breaker cache)
REDIS_URL_FALLBACK=redis://localhost:6379
```

### Circuit Breaker Settings

| Service | Timeout | Error Threshold | Fallback Strategy |
|---------|---------|-----------------|-------------------|
| Store Service | 15s | 50% | Cache + Queue |
| Hardware Service | 30s | 40% | Cache + Queue |
| **Security Service** | 20s | 30% | **FAIL CLOSED** |

---

## 📈 Performance & Scalability

### Database Layer
- **Read/Write Splitting**: Reads use replicas, writes use primary
- **Connection Pooling**: Max 20 connections per pool
- **Health Checks**: Every 30-45 seconds
- **Automatic Failover**: Promotes replicas on primary failure

### Caching Strategy
- Stale data served during service degradation
- Metadata included (`isStale`, `nextRetry`)
- Write operations queued for later processing

### Kubernetes Deployment
```yaml
# HorizontalPodAutoscaler
minReplicas: 3
maxReplicas: 10
targetCPUUtilizationPercentage: 70

# Resources
requests:
  cpu: 500m
  memory: 512Mi
limits:
  cpu: 1000m
  memory: 1Gi
```

---

## 🛠️ Development

### Code Quality Standards

- **TypeScript Strict Mode**: No `any` types allowed
- **ESLint**: AirBnB style guide with TypeScript rules
- **Prettier**: Automatic code formatting
- **Test Coverage**: Minimum 80% threshold
- **Commits**: Atomic, conventional commits format

### Git Workflow

```bash
# Feature branch
git checkout -b feature/your-feature

# Make changes, commit atomically
git commit -m "feat: add new feature"

# Run tests before pushing
npm test && npm run build

# Push and create PR
git push origin feature/your-feature
```

### Incremental Development Protocol

1. **Plan First**: Document changes in implementation plan
2. **Build Incrementally**: One component at a time
3. **Test After Each Component**: Run `npm run build && npm test`
4. **Commit Atomically**: Small, focused commits
5. **Quality First**: Strict types, early returns, error handling

---

## 📚 Documentation

- **[Development Guide](documentation/DEVELOPMENT_GUIDE.md)** - Complete walkthrough with examples
- **[Implementation Plan](documentation/IMPLEMENTATION_PLAN.md)** - Original design & architecture
- **[Task Breakdown](documentation/TASK_BREAKDOWN.md)** - Phase-by-phase checklist

---

## 🚢 Deployment

### Docker Build

```bash
# Build image
docker build -t store-provisioning-platform .

# Run container
docker run -d \
  -p 3000:3000 \
  -e VAULT_ADDR=http://vault:8200 \
  -e DATABASE_URL=postgresql://... \
  store-provisioning-platform
```

### Kubernetes Deployment

```bash
# Apply manifests (from PRD)
kubectl apply -f kubernetes/
# Includes: deployment, service, hpa, configmap, secrets
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the Incremental Development Protocol
4. Ensure tests pass and coverage ≥80%
5. Submit a pull request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🎓 Learning Resources

### For Junior Developers

**Circuit Breakers**
> A circuit breaker prevents cascading failures. If Vault crashes, the breaker trips immediately instead of waiting 10s per request, keeping the system alive.

**Optimistic Locking**
> Prevents lost updates. If two users edit the same store, only the first save succeeds. The second gets rejected with a concurrency error.

**Fail Closed vs Fail Open**
> - **Fail Open**: Service down = allow access (prioritizes availability)
> - **Fail Closed**: Service down = deny access (prioritizes security)
> 
> We use fail-closed for the security service to prevent unauthorized access.

---

## 💡 Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3 (Strict Mode)
- **Framework**: Express.js
- **Database**: PostgreSQL 14+ with pg driver
- **Secrets**: HashiCorp Vault
- **Validation**: Joi, Validator.js, DOMPurify
- **Resilience**: Opossum (circuit breakers)
- **Testing**: Jest, ts-jest
- **Linting**: ESLint, Prettier

---

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ following incremental development best practices**
