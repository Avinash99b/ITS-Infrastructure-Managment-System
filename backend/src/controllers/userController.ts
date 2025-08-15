import type {Request, Response} from 'express';
import {User} from '../models/userModel';
import db from "../components/db";
import {z} from 'zod';
import logger from '../components/logger';
import zodErrorMapper from "../components/zodErrorMapper";


// Zod validation schema
const updatePermissionsSchema = z.object({
    permissionsToKeep: z.array(z.string()),
    userMobileNo: z.string().length(10).regex(/^\d+$/)
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
        logger.info('Fetched all users', {user: _req.user?.id});

        // Return the list of users
        res.json(users);
    } catch (err) {
        logger.error('Failed to fetch users', {error: err, user: _req.user?.id});
        res.status(500).json({error: 'Failed to fetch users', details: err});
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
        const userPermissions = req.user?.permissions || [];
        logger.info('Fetched user permissions', {user: req.user?.id});

        res.json(userPermissions);
    } catch (err) {
        logger.error('Failed to fetch user permissions', {error: err, user: req.user?.id});
        res.status(500).json({error: 'Failed to fetch user permissions', details: err});
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
            logger.warn('User ID is required for getUser', {user: req.user?.id});
            return res.status(400).json({error: 'User ID is required'});
        }
        // Fetch the user by ID
        const user = await db('users').where({id: userId}).first() as User;
        if (!user) {
            logger.warn('User not found', {user: req.user?.id});
            return res.status(404).json({error: 'User not found'});
        }

        // Remove sensitive information
        user.password_hash = undefined as any; // Remove password hash
        user.created_at = undefined as any; // Remove created_at timestamp
        user.updated_at = undefined as any; // Remove updated_at timestamp
        user.permissions = req.user?.permissions || [];

        logger.info('Fetched user details', {user: req.user?.id});
        // Return the user details
        res.json(user);
    } catch (err) {
        logger.error('Failed to fetch user', {error: err, user: req.user?.id});
        res.status(500).json({error: 'Failed to fetch user', details: err});
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
        const updaterUserId = req.user?.id;
        if (!updaterUserId) {
            logger.warn('User ID is required for updateUserPermissions', {user: req.user?.id});
            return res.status(400).json({error: 'User ID is required'});
        }
        const parsed = updatePermissionsSchema.safeParse(req.body);
        if (!parsed.success) {
            logger.warn('Invalid permissions update input', {errors: parsed.error.issues, user: req.user?.id});
            return res.status(400).json({error: 'Invalid input', details: parsed.error.issues.map(zodErrorMapper)});
        }

        const {permissionsToKeep, userMobileNo} = parsed.data;

        // First get user from updaterUserId, he can only grant permissions to other users, not himself, and only permissionsToKeep he has
        const updaterUser = await db('users').where({id: updaterUserId}).first() as User;
        if (!updaterUser) {
            logger.warn('Updater user not found', {user: updaterUserId});
            return res.status(404).json({error: 'Updater user not found'});
        }

        if(updaterUser.mobile_no==userMobileNo){
            logger.warn('Updater user cannot update their own permissions', {user: updaterUserId});
            return res.status(403).json({error: 'You cannot update your own permissions'});
        }

        const userToUpdate = await db('users').where({mobile_no: userMobileNo}).first() as User;
        if (!userToUpdate) {
            logger.warn('User to update not found', {mobile_no: userMobileNo, user: updaterUserId});
            return res.status(404).json({error: 'User to update not found'});
        }
        const availablePermissions = await db('permissions').select('name') as { name: string }[];
        const availablePermissionsSet = new Set(availablePermissions.map(p => p.name));

        // Validate that all provided permissions are available
        const invalidPermissions = permissionsToKeep.filter(permission => !availablePermissionsSet.has(permission));
        if (invalidPermissions.length > 0) {
            return res.status(400).json({error: 'Invalid permissions provided', invalidPermissions});
        }

        //Check if permissionsToKeep is an array and not contains *
        if (!Array.isArray(permissionsToKeep)) {
            return res.status(400).json({error: 'Invalid permissions format'});
        }

        // Check if updaterUser has permission to grant permissions
        for( const permission of permissionsToKeep) {
            if(updaterUser.permissions?.includes("*")){
                logger.info('Updater user has wildcard permission, allowing all permissions', {user: updaterUserId});
                continue; // If updaterUser has wildcard permission, allow all permissions
            }
            if (permission === '*') {
                logger.warn('Updater user cannot grant wildcard (*) permission', {user: updaterUserId});
                return res.status(400).json({error: 'You cannot grant wildcard (*) permission'});
            }
            if (!updaterUser.permissions?.includes(permission)) {
                logger.warn('Updater user does not have permission to grant', {permission, user: updaterUserId});
                return res.status(403).json({error: `You do not have permission to grant ${permission}`});
            }
        }

        await db('users').where({mobile_no: userMobileNo}).update({permissions: JSON.stringify(permissionsToKeep)});
        logger.info('Updated user permissions', {user: req.user?.id, permissions: permissionsToKeep});

        res.json({message: 'Permissions updated successfully', success: true, userMobileNo, permissions: permissionsToKeep});
    } catch (err) {
        logger.error('Failed to update user permissions', {error: err, user: req.user?.id});
        res.status(500).json({error: 'Failed to update user permissions', details: err});
    }
};

/***
 * Fetches permissions for a user by ID.
 * @param req
 * @param res
 */
export const getPermissionsByUserId = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const user = await db('users').where({ id }).first();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // permissions is stored as JSONB
        res.json(user.permissions || []);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user permissions', details: err });
    }
};
