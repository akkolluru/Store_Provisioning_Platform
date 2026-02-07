# Medusa Store Helm Chart (STUB)

## Status: Not Implemented

This is a placeholder for the Medusa.js e-commerce engine. The current implementation focuses on WooCommerce.

## Future Implementation

When implemented, this chart will provision:
- Medusa backend server (Node.js)
- PostgreSQL database
- Redis cache
- Medusa Admin UI
- Medusa Storefront (Next.js)
- MinIO for file storage

## Architecture (Planned)

```
┌─────────────────┐
│    Ingress      │
└────────┬────────┘
         │
    ┌────▼────────┐
    │   Medusa    │  (Backend API)
    │   Server    │
    └────┬────────┘
         │
    ┌────▼─────┬────────┬──────────┐
    │PostgreSQL│  Redis │  MinIO   │
    └──────────┴────────┴──────────┘
```

## References

- [Medusa Documentation](https://docs.medusajs.com/)
- [Medusa Docker](https://github.com/medusajs/medusa)

## Contributing

To implement this chart, refer to:
- `helm/woocommerce/` for structure reference
- Medusa official deployment guides
- Kubernetes best practices for Node.js apps
