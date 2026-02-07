export type StoreType = 'flagship' | 'standard' | 'kiosk';
export type StoreStatus = 'active' | 'provisioning' | 'ready' | 'failed' | 'decommissioned';
export type StoreEngine = 'woocommerce' | 'medusa';

export interface HardwareConfig {
    pos: number;
    printers: number;
    scanners: number;
}

export interface NetworkConfig {
    vlan: number;
    ip_range: string;
}

export interface Store {
    id: string; // Changed from number to string (UUID)
    name: string;
    location: string | null;
    type: StoreType | null;
    status: StoreStatus;
    version: string;
    hardware_config: HardwareConfig | null;
    network_config: NetworkConfig | null;
    created_at: string;
    updated_at: string;
    decommissioned_at: string | null;
    // E-commerce fields
    engine: StoreEngine;
    url: string | null;
    namespace: string | null;
}

export interface CreateStoreRequest {
    name: string;
    location?: string;
    type?: StoreType;
    hardware_config?: HardwareConfig;
    network_config?: NetworkConfig;
    config?: {
        engine?: StoreEngine;
        subdomain?: string;
    };
}

export interface UpdateStoreRequest {
    name?: string;
    location?: string;
    status?: StoreStatus;
    hardware_config?: HardwareConfig;
    network_config?: NetworkConfig;
}
