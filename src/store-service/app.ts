import express, { Express, Request, Response, NextFunction } from 'express';
import VaultService from '../shared/services/vault-service';
import storesRouter from './routes/stores';
import { AuditLogger } from '../shared/services/audit-logger';
import { generalApiRateLimiter } from '../shared/middleware/rate-limiter.middleware';

/** Express application for the Store Provisioning Platform. */
class StoreService {
    public app: Express;
    private dbConfig: string | null = null;

    constructor() {
        this.app = express();
        this.setupMiddleware();
    }

    private setupMiddleware(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));


        this.app.use((req: Request, _res: Response, next: NextFunction) => {
            req.headers['x-request-id'] = req.headers['x-request-id'] || Date.now().toString();
            next();
        });

        this.app.use((req: Request, _res: Response, next: NextFunction) => {
            console.info(`${req.method} ${req.path}`, {
                requestId: req.headers['x-request-id'],
                timestamp: new Date().toISOString(),
            });
            next();
        });

        this.app.use(generalApiRateLimiter);
        this.app.use(AuditLogger.middleware());
    }

    /** Load database configuration from Vault (falls back to env vars). */
    async initialize(): Promise<void> {
        try {
            console.log('Initializing Store Service...');

            const dbConfig = await VaultService.readSecret('kv/data/database/primary');
            this.dbConfig = dbConfig.data.connectionString as string;

            if (this.dbConfig) {
                process.env.DATABASE_URL = this.dbConfig;
            }

            console.log('Configuration loaded from Vault successfully');
        } catch (error) {
            console.error('Failed to load configuration from Vault:', error);
            console.warn('Falling back to environment variables...');
            // Service can still start with environment variables
        }
    }

    setupRoutes(): void {
        this.app.get('/health', (_req: Request, res: Response) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                service: 'store-service',
            });
        });

        this.app.get('/ready', (_req: Request, res: Response) => {
            const isReady = this.dbConfig !== null;
            res.status(isReady ? 200 : 503).json({
                status: isReady ? 'ready' : 'not ready',
                timestamp: new Date().toISOString(),
            });
        });

        this.app.use('/api', storesRouter);

        this.app.get('/', (_req: Request, res: Response) => {
            const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
            res.status(200).json({
                service: 'Store Provisioning Platform API',
                version: process.env.npm_package_version || '1.0.0',
                endpoints: {
                    health: `${baseUrl}/health`,
                    readiness: `${baseUrl}/ready`,
                    stores: {
                        list: `${baseUrl}/api/stores`,
                        get: `${baseUrl}/api/stores/:id`,
                        create: `${baseUrl}/api/stores (POST)`,
                        update: `${baseUrl}/api/stores/:id (PUT)`,
                        delete: `${baseUrl}/api/stores/:id (DELETE)`,
                    },
                    testing: {
                        stressCpu: `${baseUrl}/api/stress-cpu`,
                    }
                },
                documentation: 'API documentation for Store Provisioning Platform'
            });
        });

        this.app.use((_req: Request, res: Response) => {
            res.status(404).json({
                error: 'NOT_FOUND',
                message: 'The requested endpoint does not exist',
            });
        });

        this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
            console.error('Unhandled error:', err);
            res.status(500).json({
                error: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occurred',
            });
        });
    }

    start(port = 3000): void {
        this.setupRoutes();
        this.app.listen(port, () => {
            console.log(`Store Service listening on port ${port}`);
            console.log(`Health check: http://localhost:${port}/health`);
            console.log(`API: http://localhost:${port}/api/stores`);
        });
    }
}

const service = new StoreService();
service
    .initialize()
    .then(() => service.start(parseInt(process.env.PORT || '3000')))
    .catch((err) => {
        console.error('Failed to start service:', err);
        process.exit(1);
    });

export default StoreService;
