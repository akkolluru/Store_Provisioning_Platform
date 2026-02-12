---
name: Microservices Patterns
description: Implement microservices architecture patterns for building scalable, resilient, and maintainable distributed systems.
---

# Microservices Patterns

## Industry Standard Guidelines

1. **Design Service Boundaries**: Create services based on business capabilities and domain boundaries. Ensure services are cohesive and loosely coupled with well-defined interfaces.

2. **Implement Communication Patterns**: Choose appropriate communication patterns (synchronous vs asynchronous) based on use cases. Use REST APIs for simple interactions and messaging queues for decoupled communication.

3. **Manage Data Consistency**: Implement distributed data management strategies such as eventual consistency, saga patterns, and event sourcing to maintain data integrity across services.

4. **Handle Cross-Cutting Concerns**: Address cross-cutting concerns like logging, monitoring, authentication, and security consistently across all services using service mesh or shared libraries.

5. **Plan for Independent Deployment**: Design services to be independently deployable and scalable. Implement proper testing and deployment strategies for individual services.