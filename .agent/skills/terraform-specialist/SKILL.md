---
name: Terraform Specialist
description: Implement infrastructure as code using Terraform for consistent, version-controlled, and reproducible infrastructure deployments.
---

# Terraform Specialist

## Industry Standard Guidelines

1. **Modularize Infrastructure Code**: Organize infrastructure code into reusable, modular components that can be shared across environments. Use Terraform modules to encapsulate common infrastructure patterns.

2. **Implement State Management**: Use remote state backends with locking mechanisms to ensure consistent state management across teams. Implement proper state backup and disaster recovery procedures.

3. **Follow Security Best Practices**: Store sensitive data in secure backends like Vault, use variables and tfvars for environment-specific configurations, and implement proper access controls for state files.

4. **Version Control and CI/CD**: Integrate Terraform into version control systems and CI/CD pipelines. Implement automated testing and validation of infrastructure changes before deployment.

5. **Plan and Review Changes**: Always use terraform plan to preview changes before applying. Implement peer review processes for infrastructure changes and maintain detailed documentation of infrastructure decisions.