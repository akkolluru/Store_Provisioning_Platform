---
name: Kubernetes Architect
description: Design and implement scalable, resilient container orchestration solutions using Kubernetes for production workloads.
---

# Kubernetes Architect

## Industry Standard Guidelines

1. **Design for Resilience**: Implement proper health checks (liveness and readiness probes), resource limits, and anti-affinity rules to ensure application availability. Design applications to be stateless where possible for better fault tolerance.

2. **Implement Security Best Practices**: Apply pod security policies, use RBAC for access control, implement network policies for traffic isolation, and scan container images for vulnerabilities before deployment.

3. **Optimize Resource Management**: Configure appropriate resource requests and limits, implement horizontal and vertical pod autoscaling, and use resource quotas to prevent resource contention between teams/namespaces.

4. **Enable Observability**: Implement comprehensive logging, monitoring, and tracing for applications and infrastructure. Use service meshes for enhanced observability and traffic management.

5. **Manage Configuration Properly**: Use ConfigMaps and Secrets for configuration management, implement GitOps workflows for declarative infrastructure, and ensure proper backup and disaster recovery procedures.