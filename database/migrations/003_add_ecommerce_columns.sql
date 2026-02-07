-- Migration to add e-commerce store provisioning columns
-- Adds: url, namespace, engine columns for WooCommerce/Medusa provisioning

ALTER TABLE stores ADD COLUMN IF NOT EXISTS url VARCHAR(255);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS namespace VARCHAR(100);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS engine VARCHAR(50) DEFAULT 'woocommerce';

-- Add index for namespace lookups
CREATE INDEX IF NOT EXISTS idx_stores_namespace ON stores(namespace);

-- Add check constraint for engine values
ALTER TABLE stores ADD CONSTRAINT check_engine_type 
  CHECK (engine IN ('woocommerce', 'medusa') OR engine IS NULL);

COMMENT ON COLUMN stores.url IS 'Public URL of the provisioned store (e.g., https://store1.local)';
COMMENT ON COLUMN stores.namespace IS 'Kubernetes namespace where store is deployed';
COMMENT ON COLUMN stores.engine IS 'E-commerce engine: woocommerce or medusa';
