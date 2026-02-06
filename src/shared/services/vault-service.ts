import Vault from 'node-vault';
import CircuitBreaker from 'opossum';

/**
 * Configuration for Vault service
 */
interface VaultConfig {
    apiVersion: string;
    endpoint: string;
    token: string;
}

/**
 * Secret data structure returned from Vault
 */
interface SecretData {
    data: Record<string, unknown>;
}

/**
 * Database credentials with lease information
 */
interface DatabaseCredentials {
    username: string;
    password: string;
    leaseDuration: number;
    leaseId: string;
}

/**
 * VaultService handles all interactions with HashiCorp Vault
 * Implements circuit breaker pattern for resilience
 */
class VaultService {
    private vault: Vault.client;
    private readSecretCircuitBreaker: CircuitBreaker;

    constructor() {
        const config: VaultConfig = {
            apiVersion: 'v1',
            endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
            token: process.env.VAULT_TOKEN || '',
        };

        this.vault = Vault(config);

        // Initialize circuit breaker for Vault read operations
        this.readSecretCircuitBreaker = new CircuitBreaker(
            (path: string) => this.readSecretInternal(path),
            {
                timeout: 10000, // 10 seconds
                errorThresholdPercentage: 25,
                resetTimeout: 60000, // 60 seconds
                rollingCountTimeout: 10000,
                rollingCountBuckets: 10,
                name: 'vault-read-secret',
            }
        );

        this.setupCircuitBreakerEvents();
    }

    /**
     * Setup event listeners for circuit breaker monitoring
     */
    private setupCircuitBreakerEvents(): void {
        this.readSecretCircuitBreaker.on('open', () => {
            console.error('CRITICAL: Vault circuit breaker opened');
        });

        this.readSecretCircuitBreaker.on('halfOpen', () => {
            console.warn('Vault circuit breaker half-open, testing...');
        });

        this.readSecretCircuitBreaker.on('close', () => {
            console.info('Vault circuit breaker closed, normal operation');
        });
    }

    /**
   * Read a secret from Vault with circuit breaker protection
   */
    async readSecret(path: string): Promise<SecretData> {
        try {
            const result = await this.readSecretCircuitBreaker.fire(path);
            return result as SecretData;
        } catch (error) {
            console.error(`Failed to read secret from Vault at path ${path}, using fallback:`, error);
            // Use fallback when circuit breaker fails
            return this.getFallbackSecret(path);
        }
    }

    /**
     * Internal method to read secret directly from Vault
     */
    private async readSecretInternal(path: string): Promise<SecretData> {
        try {
            const result = await this.vault.read(path);
            return result.data as SecretData;
        } catch (error: unknown) {
            if (this.isVaultError(error) && error.response?.statusCode === 404) {
                throw new Error(`Secret not found at path: ${path}`);
            }
            throw error;
        }
    }

    /**
     * Type guard for Vault errors
     */
    private isVaultError(error: unknown): error is { response?: { statusCode: number } } {
        return typeof error === 'object' && error !== null && 'response' in error;
    }

    /**
     * Fallback mechanism when Vault is unavailable
     * Maps paths to environment variables
     */
    private getFallbackSecret(path: string): SecretData {
        const fallbackMap: Record<string, SecretData> = {
            'kv/data/database/primary': {
                data: {
                    connectionString: process.env.DATABASE_URL_FALLBACK || '',
                },
            },
            'kv/data/redis/config': {
                data: {
                    url: process.env.REDIS_URL_FALLBACK || '',
                },
            },
        };

        return fallbackMap[path] || { data: {} };
    }

    /**
     * Get dynamic database credentials from Vault
     */
    async getDatabaseCredentials(role: string): Promise<DatabaseCredentials> {
        try {
            const result = await this.vault.read(`database/creds/${role}`);
            const data = result.data as {
                username: string;
                password: string;
                lease_duration: number;
                lease_id: string;
            };

            return {
                username: data.username,
                password: data.password,
                leaseDuration: data.lease_duration,
                leaseId: data.lease_id,
            };
        } catch (error) {
            console.error(`Failed to get database credentials for role ${role}:`, error);
            throw error;
        }
    }

    /**
     * Encrypt data using Vault Transit engine
     */
    async encryptData(data: string, keyName = 'encryption-key'): Promise<{ ciphertext: string }> {
        try {
            const result = await this.vault.write(`transit/encrypt/${keyName}`, {
                plaintext: Buffer.from(data).toString('base64'),
            });

            return result.data as { ciphertext: string };
        } catch (error) {
            console.error(`Failed to encrypt data with key ${keyName}:`, error);
            throw error;
        }
    }

    /**
     * Decrypt data using Vault Transit engine
     */
    async decryptData(ciphertext: string, keyName = 'encryption-key'): Promise<string> {
        try {
            const result = await this.vault.write(`transit/decrypt/${keyName}`, {
                ciphertext: ciphertext,
            });

            const data = result.data as { plaintext: string };
            return Buffer.from(data.plaintext, 'base64').toString('utf8');
        } catch (error) {
            console.error(`Failed to decrypt data with key ${keyName}:`, error);
            throw error;
        }
    }
}

export default new VaultService();
