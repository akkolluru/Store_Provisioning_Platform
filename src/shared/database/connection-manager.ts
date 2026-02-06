import { Pool, PoolConfig, QueryResult } from 'pg';
import { EventEmitter } from 'events';

/**
 * Configuration for a database connection pool
 */
interface PoolConfiguration {
    connectionString: string;
    maxConnections?: number;
    idleTimeout?: number;
    connectionTimeout?: number;
    maxLifetime?: number;
    ssl?: boolean;
}

/**
 * Configuration for the entire database cluster
 */
interface DatabaseConfig {
    primary: PoolConfiguration;
    replicas?: PoolConfiguration[];
}

/**
 * Options for query execution
 */
interface QueryOptions {
    useReplica?: boolean;
    retryAttempts?: number;
}

/**
 * Replica pool with health status
 */
interface ReplicaPool {
    index: number;
    pool: Pool;
    isHealthy: boolean;
    lastCheck: number;
}

/**
 * DatabaseConnectionManager manages PostgreSQL connections with automatic failover
 * Supports primary/replica architecture with health monitoring
 */
class DatabaseConnectionManager extends EventEmitter {
    private primaryConfig: PoolConfiguration;
    private replicaConfigs: PoolConfiguration[];
    private primaryPool: Pool;
    private replicaPools: ReplicaPool[];
    private currentPrimary: Pool;
    private currentReplica: Pool | null;
    private healthCheckInterval: NodeJS.Timeout | null = null;

    constructor(config: DatabaseConfig) {
        super();
        this.primaryConfig = config.primary;
        this.replicaConfigs = config.replicas || [];
        this.replicaPools = [];
        this.currentReplica = null;

        // Initialize pools
        this.primaryPool = this.createPool(this.primaryConfig);
        this.currentPrimary = this.primaryPool;

        this.initializeReplicaPools();
        this.startHealthChecks();
    }

    /**
     * Create a connection pool with the given configuration
     */
    private createPool(config: PoolConfiguration): Pool {
        const poolConfig: PoolConfig = {
            connectionString: config.connectionString,
            max: config.maxConnections || 20,
            idleTimeoutMillis: config.idleTimeout || 30000,
            connectionTimeoutMillis: config.connectionTimeout || 2000,
            ssl: config.ssl || false,
        };

        return new Pool(poolConfig);
    }

    /**
     * Initialize replica connection pools
     */
    private initializeReplicaPools(): void {
        this.replicaPools = this.replicaConfigs.map((replica, index) => ({
            index,
            pool: this.createPool(replica),
            isHealthy: true,
            lastCheck: Date.now(),
        }));

        // Set the first replica as current if available
        if (this.replicaPools.length > 0) {
            this.currentReplica = this.replicaPools[0].pool;
        } else {
            // Fall back to primary if no replicas
            this.currentReplica = this.primaryPool;
        }
    }

    /**
     * Execute a query with automatic retry and failover
     */
    async executeQuery(
        query: string,
        params?: unknown[],
        options: QueryOptions = {}
    ): Promise<QueryResult> {
        const { useReplica = false, retryAttempts = 3 } = options;
        let attempt = 0;

        while (attempt < retryAttempts) {
            try {
                const pool =
                    useReplica && this.currentReplica ? this.currentReplica : this.currentPrimary;
                const client = await pool.connect();

                try {
                    const result = await client.query(query, params);
                    return result;
                } finally {
                    client.release();
                }
            } catch (error) {
                attempt++;

                if (attempt >= retryAttempts) {
                    // Try failover to another node
                    await this.handleFailover(error);
                    throw error;
                }

                // Exponential backoff
                await this.sleep(1000 * attempt);
            }
        }

        throw new Error('Query execution failed after all retry attempts');
    }

    /**
     * Handle failover when primary or replica fails
     */
    private async handleFailover(error: unknown): Promise<void> {
        console.error('Database failover initiated:', error);

        // Check if primary is still healthy
        if (await this.isConnectionHealthy(this.primaryPool)) {
            this.currentPrimary = this.primaryPool;
            this.emit('failover', { from: 'replica', to: 'primary', reason: 'primary recovery' });
            return;
        }

        // Try to find a healthy replica to promote
        for (const replica of this.replicaPools) {
            if (replica.isHealthy && (await this.isConnectionHealthy(replica.pool))) {
                this.currentPrimary = replica.pool;
                this.emit('failover', {
                    from: 'primary',
                    to: `replica-${replica.index}`,
                    reason: 'primary failure',
                });
                return;
            }
        }

        // No healthy nodes found
        this.emit('failover', {
            from: 'any',
            to: 'none',
            reason: 'all nodes unhealthy',
        });
    }

    /**
     * Check if a connection pool is healthy
     */
    private async isConnectionHealthy(pool: Pool): Promise<boolean> {
        try {
            const client = await pool.connect();
            await client.query('SELECT 1');
            client.release();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Start periodic health checks for all pools
     */
    private startHealthChecks(): void {
        // Health check for primary every 30 seconds
        setInterval(async () => {
            const isHealthy = await this.isConnectionHealthy(this.primaryPool);
            if (!isHealthy) {
                console.warn('Primary database connection is unhealthy');
                this.emit('health-change', { component: 'primary', status: 'unhealthy' });
            }
        }, 30000);

        // Health check for replicas every 45 seconds
        setInterval(async () => {
            for (let i = 0; i < this.replicaPools.length; i++) {
                const replica = this.replicaPools[i];
                const isHealthy = await this.isConnectionHealthy(replica.pool);

                if (replica.isHealthy !== isHealthy) {
                    replica.isHealthy = isHealthy;
                    replica.lastCheck = Date.now();

                    this.emit('health-change', {
                        component: `replica-${i}`,
                        status: isHealthy ? 'healthy' : 'unhealthy',
                    });
                }
            }
        }, 45000);
    }

    /**
     * Gracefully close all database connections
     */
    async close(): Promise<void> {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        await this.primaryPool.end();

        for (const replica of this.replicaPools) {
            await replica.pool.end();
        }
    }

    /**
     * Sleep utility for retry backoff
     */
    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export default DatabaseConnectionManager;
