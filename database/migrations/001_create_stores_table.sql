-- Create stores table with UUID primary key
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    config JSONB,
    version INTEGER DEFAULT 1,
    engine VARCHAR(50) DEFAULT 'woocommerce',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);

-- Create index on engine
CREATE INDEX IF NOT EXISTS idx_stores_engine ON stores(engine);
