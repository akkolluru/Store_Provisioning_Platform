import Joi from 'joi';

/**
 * Store status enum
 */
export enum StoreStatus {
    PROVISIONING = 'provisioning',
    ACTIVE = 'active',
    DECOMMISSIONED = 'decommissioned',
    FAILED = 'failed',
    READY = 'ready',
}

/**
 * Store entity interface
 */
export interface Store {
    id: string;
    name: string;
    status: StoreStatus;
    config: Record<string, unknown>;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Store creation request interface
 */
export interface CreateStoreRequest {
    name: string;
    config?: Record<string, unknown>;
}

/**
 * Store update request interface
 */
export interface UpdateStoreRequest {
    name?: string;
    config?: Record<string, unknown>;
    status?: StoreStatus;
    version: number; // For optimistic locking
}

/**
 * Validation schema for creating a store
 */
export const createStoreSchema = Joi.object({
    name: Joi.string().min(3).max(100).required().messages({
        'string.base': 'Name must be a string',
        'string.empty': 'Name cannot be empty',
        'string.min': 'Name must be at least 3 characters',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required',
    }),
    config: Joi.object().optional().messages({
        'object.base': 'Config must be an object',
    }),
});

/**
 * Validation schema for updating a store
 */
export const updateStoreSchema = Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    config: Joi.object().optional(),
    status: Joi.string()
        .valid(...Object.values(StoreStatus))
        .optional(),
    version: Joi.number().integer().min(1).required().messages({
        'number.base': 'Version must be a number',
        'number.integer': 'Version must be an integer',
        'number.min': 'Version must be at least 1',
        'any.required': 'Version is required for optimistic locking',
    }),
});
