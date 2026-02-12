---
name: Distributed Tracing
description: Implement distributed tracing to monitor and troubleshoot requests across microservices architectures.
---

# Distributed Tracing

## Industry Standard Guidelines

1. **Instrument Request Flow**: Implement trace context propagation across service boundaries to track requests through the entire system. Use standardized trace formats like W3C Trace Context.

2. **Capture Relevant Metadata**: Include business-relevant metadata in traces such as user IDs, session IDs, and operation types to facilitate debugging and analysis.

3. **Sample Strategically**: Implement appropriate sampling strategies to balance insight with resource usage. Use adaptive sampling based on system load and interesting request patterns.

4. **Correlate with Logs and Metrics**: Link trace IDs to log entries and related metrics to enable comprehensive troubleshooting across all observability pillars.

5. **Visualize Service Dependencies**: Use tracing data to map service dependencies and identify bottlenecks, failure patterns, and optimization opportunities.