export type StoreType = 'flagship' | 'standard' | 'kiosk';
export type StoreStatus = 'active' | 'provisioning' | 'decommissioned';

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
    id: number;
    name: string;
    location: string;
    type: StoreType;
    status: StoreStatus;
    version: string;
    hardware_config: HardwareConfig;
    network_config: NetworkConfig;
    created_at: string;
    updated_at: string;
    decommissioned_at: string | null;
}

export interface CreateStoreRequest {
    name: string;
    location: string;
    type: StoreType;
    hardware_config: HardwareConfig;
    network_config: NetworkConfig;
}

export interface UpdateStoreRequest {
    name?: string;
    location?: string;
    status?: StoreStatus;
    hardware_config?: HardwareConfig;
    network_config?: NetworkConfig;
}
