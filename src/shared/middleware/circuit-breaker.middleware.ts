import CircuitBreaker from 'opossum';
import { Request, Response, NextFunction } from 'express';

/**
 * Alert data for monitoring systems
 */
interface AlertData {
    circuit?: string;
    timestamp?: Date;
    path?: string;
    ip?: string;
    error?: string;
}

/**
 * CircuitBreakerManager manages all circuit breakers for the application
 * Implements fail-fast and fail-closed patterns for resilience
 */
class CircuitBreakerManager {
    private circuitBreakers: Map<string, CircuitBreaker>;

    constructor() {
        this.circuitBreakers = new Map();
        this.initCircuitBreakers();
    }

    /**
     * Initialize all circuit breakers with production-ready configurations
     */
    private initCircuitBreakers(): void {
        // Store Service Circuit Breaker
        this.circuitBreakers.set(
            'store-service',
            new CircuitBreaker(this.callStoreService.bind(this), {
                timeout: 15000, // 15 seconds for database operations
                errorThresholdPercentage: 50,
                resetTimeout: 30000, // 30 seconds
                rollingCountTimeout: 10000,
                rollingCountBuckets: 10,
                name: 'store-service',
                volumeThreshold: 10,
            })
        );

        // Hardware Service Circuit Breaker
        this.circuitBreakers.set(
            'hardware-service',
            new CircuitBreaker(this.callHardwareService.bind(this), {
                timeout: 30000, // 30 seconds for hardware operations
                errorThresholdPercentage: 40,
                resetTimeout: 60000, // 60 seconds
                rollingCountTimeout: 15000,
                rollingCountBuckets: 15,
                name: 'hardware-service',
                volumeThreshold: 5,
            })
        );

        // Security Service Circuit Breaker - FAIL CLOSED
        this.circuitBreakers.set(
            'security-service',
            new CircuitBreaker(this.callSecurityService.bind(this), {
                timeout: 20000, // 20 seconds
                errorThresholdPercentage: 30,
                resetTimeout: 120000, // 120 seconds - longer for security
                rollingCountTimeout: 20000,
                rollingCountBuckets: 20,
                name: 'security-service',
                volumeThreshold: 3,
            })
        );

        this.attachEventListeners();
    }

    /**
     * Attach event listeners to all circuit breakers for monitoring
     */
    private attachEventListeners(): void {
        for (const [name, cb] of this.circuitBreakers) {
            cb.on('open', () => {
                console.error(`CIRCUIT_BREAKER_OPEN: ${name} circuit breaker opened`);
                this.emitAlert('CIRCUIT_BREAKER_OPEN', { circuit: name, timestamp: new Date() });
            });

            cb.on('close', () => {
                console.info(`CIRCUIT_BREAKER_CLOSE: ${name} circuit breaker closed`);
                this.emitAlert('CIRCUIT_BREAKER_CLOSE', { circuit: name, timestamp: new Date() });
            });

            cb.on('halfOpen', () => {
                console.warn(`CIRCUIT_BREAKER_HALF_OPEN: ${name} circuit breaker half-open`);
                this.emitAlert('CIRCUIT_BREAKER_HALF_OPEN', { circuit: name, timestamp: new Date() });
            });


            cb.on('failure', (error: Error) => {
                console.error(`CIRCUIT_BREAKER_FAILURE: ${name} operation failed:`, error);
            });
        }
    }

    /**
     * Middleware for store service with caching fallback
     */
    storeServiceMiddleware() {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            const breaker = this.circuitBreakers.get('store-service');
            if (!breaker) {
                return next();
            }

            try {
                await breaker.fire(req, res, next);
            } catch (error) {
                // Fallback: Return cached data for GET requests
                if (req.method === 'GET' && req.path.startsWith('/api/stores')) {
                    res.setHeader('X-Cache-Status', 'fallback');
                    res.setHeader('X-Service-Status', 'degraded');
                    res.status(200).json({
                        ...this.getCachedStoreData(),
                        meta: {
                            isStale: true,
                            staleReason: 'service_unavailable',
                            dataTimestamp: new Date(Date.now() - 3600000).toISOString(),
                            nextRetry: new Date(Date.now() + 30000).toISOString(),
                        },
                        message: 'Data served from cache due to service unavailability',
                    });
                    return;
                }

                // Queue write operations
                if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
                    this.queueRequestForLater(req);
                    res.status(202).json({
                        status: 'accepted',
                        message: 'Request queued for processing when service becomes available',
                        requestId: req.headers['x-request-id'] || Date.now().toString(),
                    });
                    return;
                }

                // Default fallback
                res.status(503).json({
                    error: 'SERVICE_UNAVAILABLE',
                    message: 'Store service temporarily unavailable, please try again later',
                    timestamp: new Date().toISOString(),
                });
            }
        };
    }

    /**
     * Middleware for hardware service with queueing fallback
     */
    hardwareServiceMiddleware() {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            const breaker = this.circuitBreakers.get('hardware-service');
            if (!breaker) {
                return next();
            }

            try {
                await breaker.fire(req, res, next);
            } catch (error) {
                // Queue device operations
                if (req.path.includes('/devices') && (req.method === 'POST' || req.method === 'PUT')) {
                    this.queueDeviceRequest(req);
                    res.status(202).json({
                        status: 'accepted',
                        message: 'Device registration queued for processing',
                        estimatedProcessingTime: 'within 24 hours',
                        requestId: req.headers['x-request-id'] || Date.now().toString(),
                    });
                    return;
                }

                // Return cached data for GET
                if (req.method === 'GET') {
                    const cachedData = this.getCachedDeviceData();
                    if (cachedData) {
                        res.status(200).json({
                            ...cachedData,
                            message: 'Device data served from cache',
                        });
                        return;
                    }
                }

                res.status(503).json({
                    error: 'SERVICE_UNAVAILABLE',
                    message: 'Hardware service temporarily unavailable',
                });
            }
        };
    }

    /**
     * Middleware for security service - FAIL CLOSED
     * If security service is down, deny all access
     */
    securityServiceMiddleware() {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            const breaker = this.circuitBreakers.get('security-service');
            if (!breaker) {
                return next();
            }

            try {
                await breaker.fire(req, res, next);
            } catch (error) {
                // CRITICAL: Fail Closed for Security Service
                console.error('Security service circuit breaker opened - FAILING CLOSED');

                res.status(503).json({
                    error: 'SECURITY_SERVICE_UNAVAILABLE',
                    message: 'Access denied due to security system unavailability. Contact administrator.',
                    timestamp: new Date().toISOString(),
                });

                this.emitAlert('SECURITY_FAIL_CLOSED', {
                    path: req.path,
                    ip: req.ip,
                });
            }
        };
    }

    /**
     * Placeholder service functions - to be implemented with actual service calls
     */
    private async callStoreService(
        _req: Request,
        _res: Response,
        next: NextFunction
    ): Promise<void> {
        // Actual implementation would make HTTP call to store service
        return next();
    }

    private async callHardwareService(
        _req: Request,
        _res: Response,
        next: NextFunction
    ): Promise<void> {
        // Actual implementation would make HTTP call to hardware service
        return next();
    }

    private async callSecurityService(
        _req: Request,
        _res: Response,
        next: NextFunction
    ): Promise<void> {
        // Actual implementation would make HTTP call to security service
        return next();
    }

    /**
     * Cache management - placeholder implementations
     */
    private getCachedStoreData(): { stores: unknown[]; message: string } {
        return { stores: [], message: 'Cached data' };
    }

    private getCachedDeviceData(): { devices: unknown[]; message: string } | null {
        return { devices: [], message: 'Cached data' };
    }

    /**
     * Queue management - placeholder implementations
     */
    private queueRequestForLater(req: Request): void {
        console.info('Request queued:', {
            method: req.method,
            path: req.path,
            timestamp: new Date().toISOString(),
        });
    }

    private queueDeviceRequest(req: Request): void {
        console.info('Device request queued:', {
            method: req.method,
            path: req.path,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Emit alert to monitoring system
     */
    private emitAlert(type: string, data: AlertData): void {
        console.warn(`ALERT: ${type}`, data);
        // In production, send to PagerDuty/monitoring system
    }

    /**
     * Get circuit breaker status for monitoring
     */
    getStatus(name: string): object | null {
        const cb = this.circuitBreakers.get(name);
        if (!cb) {
            return null;
        }

        return {
            name: cb.name,
            status: cb.opened ? 'open' : cb.halfOpen ? 'half-open' : 'closed',
            stats: cb.stats,
        };
    }

    /**
     * Get all circuit breaker statuses
     */
    getAllStatuses(): Record<string, object | null> {
        const statuses: Record<string, object | null> = {};
        for (const [name] of this.circuitBreakers) {
            statuses[name] = this.getStatus(name);
        }
        return statuses;
    }
}

export default new CircuitBreakerManager();
