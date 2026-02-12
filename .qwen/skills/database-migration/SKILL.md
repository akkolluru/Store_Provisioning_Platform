---
name: Database Migration
description: Manage database schema changes and data migrations with zero downtime and rollback capabilities.
---

# Database Migration

## Industry Standard Guidelines

1. **Plan Backward-Compatible Changes**: Design schema changes that are backward compatible to enable zero-downtime deployments. Use additive changes first, then remove deprecated elements in subsequent releases.

2. **Implement Safe Migration Patterns**: Use blue-green deployment strategies for database migrations when possible. Employ techniques like the expand-contract pattern to ensure data consistency during transitions.

3. **Test Migrations Thoroughly**: Test migration scripts on production-like data before applying to production. Implement rollback procedures and validate data integrity after each migration.

4. **Monitor Migration Impact**: Monitor system performance and application functionality during and after migrations. Have immediate rollback procedures ready in case of issues.

5. **Document Migration Procedures**: Maintain detailed documentation of migration processes, dependencies, and rollback procedures. Ensure team members understand the migration workflow and can execute it reliably.