-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    type VARCHAR(50) CHECK (type IN ('flagship', 'standard', 'kiosk')),
    status VARCHAR(50) CHECK (status IN ('active', 'provisioning', 'decommissioned')) DEFAULT 'provisioning',
    version VARCHAR(50) DEFAULT '1.0.0',
    hardware_config JSONB,
    network_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decommissioned_at TIMESTAMP
);

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);

-- Create index on type
CREATE INDEX IF NOT EXISTS idx_stores_type ON stores(type);

-- Create audit log table
CREATE TABLE IF NOT EXISTS store_audit_log (
    id SERIAL PRIMARY KEY,
    store_id INTEGER REFERENCES stores(id),
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    performed_by VARCHAR(255),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on store_id for audit log
CREATE INDEX IF NOT EXISTS idx_audit_store_id ON store_audit_log(store_id);
