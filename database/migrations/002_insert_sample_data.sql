-- Insert sample stores
INSERT INTO stores (name, location, type, status, hardware_config, network_config) VALUES
('Store Alpha', 'New York, NY', 'flagship', 'active', 
 '{"pos": 5, "printers": 3, "scanners": 10}'::jsonb,
 '{"vlan": 100, "ip_range": "192.168.1.0/24"}'::jsonb),
 
('Store Beta', 'Los Angeles, CA', 'standard', 'active',
 '{"pos": 3, "printers": 2, "scanners": 5}'::jsonb,
 '{"vlan": 101, "ip_range": "192.168.2.0/24"}'::jsonb),
 
('Store Gamma', 'Chicago, IL', 'standard', 'provisioning',
 '{"pos": 3, "printers": 2, "scanners": 5}'::jsonb,
 '{"vlan": 102, "ip_range": "192.168.3.0/24"}'::jsonb),
 
('Store Delta', 'Houston, TX', 'kiosk', 'active',
 '{"pos": 1, "printers": 1, "scanners": 2}'::jsonb,
 '{"vlan": 103, "ip_range": "192.168.4.0/24"}'::jsonb),
 
('Store Epsilon', 'Phoenix, AZ', 'flagship', 'decommissioned',
 '{"pos": 5, "printers": 3, "scanners": 10}'::jsonb,
 '{"vlan": 104, "ip_range": "192.168.5.0/24"}'::jsonb);

-- Insert audit log entries
INSERT INTO store_audit_log (store_id, action, changes, performed_by) VALUES
(1, 'created', '{"status": "active"}'::jsonb, 'admin@example.com'),
(2, 'created', '{"status": "active"}'::jsonb, 'admin@example.com'),
(3, 'created', '{"status": "provisioning"}'::jsonb, 'admin@example.com'),
(5, 'decommissioned', '{"status": "decommissioned"}'::jsonb, 'admin@example.com');
