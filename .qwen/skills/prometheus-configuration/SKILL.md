---
name: Prometheus Configuration
description: Configure and optimize Prometheus for metrics collection, storage, and querying in production environments.
---

# Prometheus Configuration

## Industry Standard Guidelines

1. **Optimize Scraping Configuration**: Configure appropriate scrape intervals and timeouts based on metric volatility and system capacity. Use service discovery to automatically detect and monitor new services.

2. **Implement Efficient Storage**: Configure retention policies and compaction settings based on storage capacity and query requirements. Use remote write for long-term storage when needed.

3. **Design Meaningful Metrics**: Follow Prometheus naming conventions and best practices for metric labeling. Create metrics that are intuitive and support effective alerting and dashboard creation.

4. **Configure Alerting Rules**: Write effective PromQL queries for alerting and recording rules. Balance alert sensitivity to minimize noise while ensuring critical issues are detected.

5. **Secure Prometheus Deployment**: Implement proper authentication and authorization for Prometheus endpoints. Protect sensitive metrics and restrict access to administrative functions.