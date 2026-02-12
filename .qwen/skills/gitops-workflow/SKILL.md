---
name: GitOps Workflow
description: Implement GitOps practices for declarative infrastructure and application management using Git as the single source of truth.
---

# GitOps Workflow

## Industry Standard Guidelines

1. **Use Git as Single Source of Truth**: Maintain all infrastructure and application configurations in Git repositories. Ensure all changes are tracked, reviewed, and auditable through Git history.

2. **Implement Declarative Configuration**: Define system states declaratively in configuration files that can be automatically reconciled with the actual system state by GitOps tools.

3. **Automate Synchronization**: Use GitOps tools to automatically synchronize the declared state in Git with the actual system state, ensuring drift is automatically corrected.

4. **Enforce Pull Request Workflows**: Require all changes to go through pull requests with peer review and automated validation before merging to ensure quality and security.

5. **Monitor and Alert on Drift**: Implement monitoring to detect configuration drift and alert when manual changes are made outside of the GitOps workflow that could cause inconsistency.