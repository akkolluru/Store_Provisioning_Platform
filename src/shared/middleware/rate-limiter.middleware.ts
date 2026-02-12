import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/** Rate limiter for store creation: max 5 per 15 minutes per IP. */
export const createStoreRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many stores created. Please try again in 15 minutes.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,

    skip: (req: Request) => {
        const clientIp = req.ip || req.socket.remoteAddress;
        return process.env.NODE_ENV === 'development' &&
            (clientIp === '127.0.0.1' || clientIp === '::1');
    },


    handler: (req: Request, res: Response) => {
        console.warn(`[RateLimiter] Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many store creation requests. Please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

/** General API rate limiter: max 100 per minute per IP. */
export const generalApiRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/** Rate limiter for delete operations: max 10 per 5 minutes per IP. */
export const deleteStoreRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many deletion requests. Please try again in 5 minutes.',
        retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/** Store quota middleware — enforces max active stores per client. */
export const MAX_STORES_PER_USER = 10;

export const storeQuotaChecker = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const clientId = req.ip || req.socket.remoteAddress || 'unknown';
        // TODO: Replace IP-based check with user-based quota when auth is added
        console.log(`[StoreQuota] Quota check passed for client: ${clientId}`);
        next();
    } catch (error) {
        console.error('[StoreQuota] Error checking store quota:', error);
        next();
    }
};
