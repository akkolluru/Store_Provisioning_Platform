-- Recreate stores table with UUID primary key and e-commerce columns
-- This consolidates previous migrations and fixes the ID type mismatch

-- Drop dependent tables first
DROP TABLE IF EXISTS store_audit_log;
DROP TABLE IF EXISTS stores;

-- Create stores table with UUID
CREATE TABLE stores (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    type VARCHAR(50) CHECK (type IN ('flagship', 'standard', 'kiosk')),
    status VARCHAR(50) CHECK (status IN ('active', 'provisioning', 'decommissioned', 'failed', 'ready')) DEFAULT 'provisioning',
    version VARCHAR(50) DEFAULT '1.0.0',
    config JSONB,
    hardware_config JSONB,
    network_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decommissioned_at TIMESTAMP,
    -- New e-commerce columns
    url VARCHAR(255),
    namespace VARCHAR(100),
    engine VARCHAR(50) CHECK (engine IN ('woocommerce', 'medusa')) DEFAULT 'woocommerce'
);

-- Create indexes
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_type ON stores(type);
CREATE INDEX idx_stores_namespace ON stores(namespace);

-- Create audit log table
CREATE TABLE store_audit_log (
    id UUID PRIMARY KEY,
    store_id UUID REFERENCES stores(id),
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    performed_by VARCHAR(255),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_store_id ON store_audit_log(store_id);

-- Insert sample data with UUIDs
INSERT INTO stores (id, name, location, type, status, hardware_config, network_config, engine) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Store Alpha', 'New York, NY', 'flagship', 'active', 
 '{"pos": 5}'::jsonb, '{"vlan": 100}'::jsonb, 'woocommerce'),
 
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Store Beta', 'Los Angeles, CA', 'standard', 'active',
 '{"pos": 3}'::jsonb, '{"vlan": 101}'::jsonb, 'woocommerce'),
 
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Store Gamma', 'Chicago, IL', 'standard', 'provisioning',
 '{"pos": 3}'::jsonb, '{"vlan": 102}'::jsonb, 'medusa');
