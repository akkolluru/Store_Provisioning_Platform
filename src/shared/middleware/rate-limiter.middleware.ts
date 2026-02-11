import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for store creation endpoint
 * Prevents abuse by limiting the number of stores that can be created
 */
export const createStoreRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 store creations per 15 minutes per IP
    message: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many stores created. Please try again in 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers

    // Skip rate limiting for certain IPs (optional, for testing)
    skip: (req: Request) => {
        // Skip for localhost in development
        const clientIp = req.ip || req.socket.remoteAddress;
        return process.env.NODE_ENV === 'development' &&
            (clientIp === '127.0.0.1' || clientIp === '::1');
    },

    // Use default key generator (handles IPv4/IPv6 correctly)

    // Handler for when limit is exceeded
    handler: (req: Request, res: Response) => {
        console.warn(`[RateLimiter] Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many store creation requests. Please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

/**
 * Rate limiter for API endpoints (general)
 * More lenient than store creation
 */
export const generalApiRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Max 100 requests per minute per IP
    message: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate limiter for delete operations
 * Prevents rapid deletion abuse
 */
export const deleteStoreRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Max 10 deletions per 5 minutes per IP
    message: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many deletion requests. Please try again in 5 minutes.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Store quota checker middleware
 * Enforces maximum number of stores per user
 */
export const MAX_STORES_PER_USER = 10;

export const storeQuotaChecker = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // For now, check by IP (will be replaced with user ID when auth is added)
        const clientId = req.ip || req.socket.remoteAddress || 'unknown';

        // TODO: Replace with actual user-based quota check when auth is implemented
        // For now, this is a placeholder that always allows creation

        // const dbManager = getDatabaseManager();
        // const result = await dbManager.executeQuery(
        //     `SELECT COUNT(*) as count FROM stores 
        //      WHERE user_id = $1 AND status != 'decommissioned'`,
        //     [userId]
        // );
        // 
        // const storeCount = parseInt(result.rows[0].count);
        // if (storeCount >= MAX_STORES_PER_USER) {
        //     return res.status(403).json({
        //         error: 'QUOTA_EXCEEDED',
        //         message: `Maximum ${MAX_STORES_PER_USER} active stores allowed per user`,
        //         currentCount: storeCount,
        //         limit: MAX_STORES_PER_USER
        //     });
        // }

        console.log(`[StoreQuota] Quota check passed for client: ${clientId}`);
        next();
    } catch (error) {
        console.error('[StoreQuota] Error checking store quota:', error);
        // Don't block on quota check failure
        next();
    }
};
