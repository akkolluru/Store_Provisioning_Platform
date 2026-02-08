-- Migration: 005_create_audit_logs.sql
-- Description: Create audit logging table for security and compliance
-- Author: Store Provisioning Platform Team
-- Date: 2026-02-07

-- Enable UUID generation if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User information (for future auth integration)
    user_id VARCHAR(255),
    user_email VARCHAR(255),
    
    -- Action details
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ACCESS', 'FAILED_CREATE', 'FAILED_DELETE')),
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('STORE', 'USER', 'CONFIG')),
    resource_id UUID,
    resource_name VARCHAR(255),
    
    -- Additional context
    details JSONB,
    
    -- Request metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource_name ON audit_logs(resource_name);

-- Create composite index for user activity queries
CREATE INDEX idx_audit_logs_user_activity ON audit_logs(user_id, created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for all critical system operations';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed: CREATE, UPDATE, DELETE, ACCESS, FAILED_*';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected';
COMMENT ON COLUMN audit_logs.details IS 'JSON object containing additional context about the action';

-- Insert sample audit log for migration
INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_name,
    details,
    ip_address
) VALUES (
    'system',
    'CREATE',
    'CONFIG',
    'audit_logs_table',
    '{"migration": "005_create_audit_logs", "purpose": "Enable audit logging"}',
    '127.0.0.1'
);
