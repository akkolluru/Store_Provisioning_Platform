import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import {
    StoreStatus,
    CreateStoreRequest,
    UpdateStoreRequest,
    createStoreSchema,
    updateStoreSchema,
} from '../models/store';
import { getDatabaseManager } from '../../shared/database/db-instance';

const router = Router();

/**
 * Input sanitization middleware
 */
function sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // First, trim and validate
    const trimmed = validator.trim(input);

    // Use DOMPurify to remove any HTML/script tags
    const purified = DOMPurify.sanitize(trimmed, {
        ALLOWED_TAGS: [], // No HTML tags allowed
        ALLOWED_ATTR: [],
    });

    // Additional validation
    if (!validator.isLength(purified, { min: 0, max: 1000 })) {
        throw new Error('Input exceeds maximum length');
    }

    return purified;
}

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        // Prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            continue;
        }

        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * GET /api/stress-cpu
 * CPU stress endpoint for HPA testing
 * Burns CPU for 50ms to trigger autoscaling thresholds
 */
router.get('/stress-cpu', (_req: Request, res: Response): void => {
    const start = Date.now();
    // Burn CPU for 50ms - enough to trigger HPA at scale
    while (Date.now() - start < 50) {
        Math.sqrt(Math.random()); // CPU-intensive operation
    }
    res.status(200).json({
        status: 'cpu_stressed',
        duration_ms: Date.now() - start,
        message: 'CPU stress completed - use for HPA testing only'
    });
});

/**
 * GET /api/stores
 * List all stores
 */
router.get('/stores', async (_req: Request, res: Response): Promise<void> => {
    try {
        const dbManager = getDatabaseManager();

        const result = await dbManager.executeQuery(
            'SELECT * FROM stores ORDER BY created_at DESC',
            [],
            { useReplica: true } // Use replica for read operations
        );

        res.status(200).json({
            stores: result.rows,
            count: result.rowCount,
        });
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).json({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch stores',
        });
    }
});

/**
 * POST /api/stores
 * Create a new store
 */
router.post('/stores', async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate request body
        const { error, value } = createStoreSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: error.details[0].message,
            });
            return;
        }

        // Sanitize input
        const sanitizedData: CreateStoreRequest = {
            name: sanitizeInput(value.name),
            config: value.config ? sanitizeObject(value.config) : {},
        };

        const dbManager = getDatabaseManager();

        const id = uuidv4();
        const now = new Date();

        const result = await dbManager.executeQuery(
            `INSERT INTO stores (id, name, status, config, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [id, sanitizedData.name, StoreStatus.PROVISIONING, JSON.stringify(sanitizedData.config), 1, now, now]
        );

        res.status(201).json({
            store: result.rows[0],
            message: 'Store created successfully',
        });
    } catch (error) {
        console.error('Error creating store:', error);
        res.status(500).json({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create store',
        });
    }
});

/**
 * PUT /api/stores/:id
 * Update a store with optimistic locking
 */
router.put('/stores/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Validate UUID
        if (!validator.isUUID(id)) {
            res.status(400).json({
                error: 'INVALID_ID',
                message: 'Invalid store ID format',
            });
            return;
        }

        // Validate request body
        const { error, value } = updateStoreSchema.validate(req.body);
        if (error) {
            res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: error.details[0].message,
            });
            return;
        }

        const updateData: UpdateStoreRequest = value;

        // Sanitize input
        if (updateData.name) {
            updateData.name = sanitizeInput(updateData.name);
        }
        if (updateData.config) {
            updateData.config = sanitizeObject(updateData.config);
        }

        const dbManager = getDatabaseManager();

        // Build dynamic UPDATE query
        const updates: string[] = [];
        const params: unknown[] = [];
        let paramIndex = 1;

        if (updateData.name) {
            updates.push(`name = $${paramIndex++}`);
            params.push(updateData.name);
        }
        if (updateData.config) {
            updates.push(`config = $${paramIndex++}`);
            params.push(JSON.stringify(updateData.config));
        }
        if (updateData.status) {
            updates.push(`status = $${paramIndex++}`);
            params.push(updateData.status);
        }

        updates.push(`version = version + 1`);
        updates.push(`updated_at = $${paramIndex++}`);
        params.push(new Date());

        // Add WHERE clause with optimistic locking
        params.push(id);
        params.push(updateData.version);

        const query = `
      UPDATE stores
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex++} AND version = $${paramIndex++}
      RETURNING *
    `;

        const result = await dbManager.executeQuery(query, params);

        if (result.rowCount === 0) {
            res.status(409).json({
                error: 'CONCURRENCY_ERROR',
                message: 'Store was modified by another request. Please refresh and try again.',
            });
            return;
        }

        res.status(200).json({
            store: result.rows[0],
            message: 'Store updated successfully',
        });
    } catch (error) {
        console.error('Error updating store:', error);
        res.status(500).json({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update store',
        });
    }
});

export default router;
