import DatabaseConnectionManager from './connection-manager';

/**
 * Singleton database connection manager
 * This ensures we reuse the same connection pool across all requests
 */
let dbConnectionManager: DatabaseConnectionManager | null = null;

export function getDatabaseManager(): DatabaseConnectionManager {
    if (!dbConnectionManager) {
        // Build connection string from environment variables
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = process.env.DB_PORT || '5432';
        const dbName = process.env.DB_NAME || 'postgres';
        const dbUser = process.env.DB_USER || 'kaushik';
        const dbPassword = process.env.DB_PASSWORD || '';

        const connectionString = process.env.DATABASE_URL ||
            `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

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
