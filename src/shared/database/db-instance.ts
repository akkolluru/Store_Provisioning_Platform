import DatabaseConnectionManager from './connection-manager';

/**
 * Singleton database connection manager
 * This ensures we reuse the same connection pool across all requests
 */
let dbConnectionManager: DatabaseConnectionManager | null = null;

export function getDatabaseManager(): DatabaseConnectionManager {
    if (!dbConnectionManager) {
        const connectionString =
            process.env.DATABASE_URL ||
            'postgresql://store_user:store_password_local@postgresql-primary.store-platform.svc.cluster.local:5432/store_db';

        dbConnectionManager = new DatabaseConnectionManager({
            primary: {
                connectionString,
                maxConnections: parseInt(process.env.DATABASE_POOL_MAX || '20'),
                idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
            },
        });

        console.log('Database connection manager initialized');
    }

    return dbConnectionManager;
}

/**
 * Gracefully close database connections
 * Call this during application shutdown
 */
export async function closeDatabaseManager(): Promise<void> {
    if (dbConnectionManager) {
        await dbConnectionManager.close();
        dbConnectionManager = null;
        console.log('Database connections closed');
    }
}

export default { getDatabaseManager, closeDatabaseManager };
