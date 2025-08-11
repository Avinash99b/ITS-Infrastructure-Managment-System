import type {Request, Response} from 'express';
import {User} from '../models/userModel';
import db from "../components/db";
import { z } from 'zod';
import logger from '../components/logger';
import zodErrorMapper from "../components/zodErrorMapper";



// Zod validation schema
const updatePermissionsSchema = z.object({
    permissionsToKeep: z.array(z.string())
});


/**
 * Fetches all users from the database.
 * Returns a list of users with their details.
 * @param _req
 * @param res
 */
export const getUsers = async (_req: Request, res: Response) => {
    try {
        // Fetch all users from the database
        const users = await db('users').select('*') as User[];
        logger.info('Fetched all users', { user: _req.user?.id });

        // Return the list of users
        res.json(users);
    } catch (err) {
        logger.error('Failed to fetch users', { error: err, user: _req.user?.id });
        res.status(500).json({ error: 'Failed to fetch users', details: err });
    }
};

/**
 * Fetches the current user's permissions.
 * Expects the user to be authenticated and available in req.user.
 * Returns the user's extra_permissions array.
 * @param req
 * @param res
 */
export const getUserPermissions = (req: Request, res: Response) => {
    try {
        const userPermissions = req.user?.extra_permissions || [];
        logger.info('Fetched user permissions', { user: req.user?.id });

        res.json(userPermissions);
    } catch (err) {
        logger.error('Failed to fetch user permissions', { error: err, user: req.user?.id });
        res.status(500).json({ error: 'Failed to fetch user permissions', details: err });
    }
};

/**
 * Fetches the current user's details.
 * Expects the user to be authenticated and available in req.user.
 * Returns the user details excluding sensitive information like password hash.
 * @param req
 * @param res
 */
export const getUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            logger.warn('User ID is required for getUser', { user: req.user?.id });
            return res.status(400).json({ error: 'User ID is required' });
        }
        // Fetch the user by ID
        const user = await db('users').where({id: userId}).first() as User;
        if (!user) {
            logger.warn('User not found', { user: req.user?.id });
            return res.status(404).json({error: 'User not found'});
        }

        // Remove sensitive information
        user.password_hash = undefined as any; // Remove password hash
        user.created_at = undefined as any; // Remove created_at timestamp
        user.updated_at = undefined as any; // Remove updated_at timestamp
        user.extra_permissions = req.user?.extra_permissions || [];

        logger.info('Fetched user details', { user: req.user?.id });
        // Return the user details
        res.json(user);
    } catch (err) {
        logger.error('Failed to fetch user', { error: err, user: req.user?.id });
        res.status(500).json({ error: 'Failed to fetch user', details: err });
    }
};

/**
 * Updates the permissions of the current user.
 * Expects a JSON body with an array of permissions to keep.
 * Example: { "permissionsToKeep": ["permission1", "permission2"] }
 * This will overwrite the user's extra_permissions with the provided permissions.
 * @param req
 * @param res
 */
export const updateUserPermissions = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            logger.warn('User ID is required for updateUserPermissions', { user: req.user?.id });
            return res.status(400).json({ error: 'User ID is required' });
        }
        const parsed = updatePermissionsSchema.safeParse(req.body);
        if (!parsed.success) {
            logger.warn('Invalid permissions update input', { errors: parsed.error.issues, user: req.user?.id });
            return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues.map(zodErrorMapper) });
        }

        const { permissionsToKeep } = parsed.data;

        const availablePermissions = await db('permissions').select('name') as { name: string }[];
        const availablePermissionsSet = new Set(availablePermissions.map(p => p.name));

        // Validate that all provided permissions are available
        const invalidPermissions = permissionsToKeep.filter(permission => !availablePermissionsSet.has(permission));
        if (invalidPermissions.length > 0) {
            return res.status(400).json({ error: 'Invalid permissions provided', invalidPermissions });
        }

        //Check if permissionsToKeep is an array and not contains *
        if (!Array.isArray(permissionsToKeep) || permissionsToKeep.includes('*')) {
            return res.status(400).json({ error: 'Invalid permissions format or cannot include wildcard "*"' });
        }

        // Overwrite extra_permissions with the provided permissionsToKeep
        await db('users').where({ id: userId }).update({ extra_permissions: JSON.stringify(permissionsToKeep) });
        logger.info('Updated user permissions', { user: req.user?.id, permissions: permissionsToKeep });

        res.json({ message: 'Permissions updated successfully' });
    } catch (err) {
        logger.error('Failed to update user permissions', { error: err, user: req.user?.id });
        res.status(500).json({ error: 'Failed to update user permissions', details: err });
    }
};
