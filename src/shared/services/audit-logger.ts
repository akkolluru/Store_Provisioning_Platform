import { Request, Response, NextFunction } from 'express';
import { getDatabaseManager } from '../database/db-instance';

export interface AuditLogEntry {
    userId?: string;
    userEmail?: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACCESS' | 'FAILED_CREATE' | 'FAILED_DELETE';
    resourceType: 'STORE' | 'USER' | 'CONFIG';
    resourceId?: string;
    resourceName?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Audit Logging Service
 * Provides comprehensive audit trail for all critical operations
 */
export class AuditLogger {
    /**
     * Log an audit event to the database
     */
    static async log(entry: AuditLogEntry): Promise<void> {
        try {
            const dbManager = getDatabaseManager();

            await dbManager.executeQuery(
                `INSERT INTO audit_logs (
                    user_id, user_email, action, resource_type, 
                    resource_id, resource_name, details, 
                    ip_address, user_agent
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    entry.userId || null,
                    entry.userEmail || null,
                    entry.action,
                    entry.resourceType,
                    entry.resourceId || null,
                    entry.resourceName || null,
                    entry.details ? JSON.stringify(entry.details) : null,
                    entry.ipAddress || null,
                    entry.userAgent || null
                ]
            );

            console.log(`[AuditLog] ${entry.action} ${entry.resourceType} ${entry.resourceId || entry.resourceName || ''}`);
        } catch (error) {
            // Don't throw - audit logging failure shouldn't break the request
            console.error('[AuditLog] Failed to write audit log:', error);
        }
    }

    /**
     * Get client IP address from request
     */
    static getClientIp(req: Request): string {
        return (
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            (req.headers['x-real-ip'] as string) ||
            req.socket.remoteAddress ||
            'unknown'
        );
    }

    /**
     * Express middleware to automatically log API requests
     */
    static middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            // Store original send
            const originalSend = res.send;

            // Override send to capture response
            res.send = function (data: any): Response {
                // Restore original send
                res.send = originalSend;

                // Log based on method and status
                if (req.method === 'POST' && res.statusCode === 201) {
                    // Store creation
                    try {
                        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
                        if (responseData.store) {
                            AuditLogger.log({
                                action: 'CREATE',
                                resourceType: 'STORE',
                                resourceId: responseData.store.id,
                                resourceName: responseData.store.name,
                                details: {
                                    engine: responseData.store.engine,
                                    subdomain: responseData.store.config?.subdomain
                                },
                                ipAddress: AuditLogger.getClientIp(req),
                                userAgent: req.get('user-agent')
                            });
                        }
                    } catch (err) {
                        console.error('[AuditLog] Failed to parse response for logging:', err);
                    }
                } else if (req.method === 'DELETE' && res.statusCode === 200) {
                    // Store deletion
                    const storeId = req.params.id;
                    if (storeId) {
                        AuditLogger.log({
                            action: 'DELETE',
                            resourceType: 'STORE',
                            resourceId: storeId,
                            ipAddress: AuditLogger.getClientIp(req),
                            userAgent: req.get('user-agent')
                        });
                    }
                } else if (res.statusCode >= 400) {
                    // Failed operations
                    const storeId = req.params.id || req.body?.id;
                    if (req.method === 'POST' && req.path.includes('/stores')) {
                        AuditLogger.log({
                            action: 'FAILED_CREATE',
                            resourceType: 'STORE',
                            resourceName: req.body?.name,
                            details: {
                                error: res.statusMessage,
                                statusCode: res.statusCode
                            },
                            ipAddress: AuditLogger.getClientIp(req),
                            userAgent: req.get('user-agent')
                        });
                    } else if (req.method === 'DELETE' && storeId) {
                        AuditLogger.log({
                            action: 'FAILED_DELETE',
                            resourceType: 'STORE',
                            resourceId: storeId,
                            details: {
                                error: res.statusMessage,
                                statusCode: res.statusCode
                            },
                            ipAddress: AuditLogger.getClientIp(req),
                            userAgent: req.get('user-agent')
                        });
                    }
                }

                return originalSend.call(this, data);
            };

            next();
        };
    }
}
