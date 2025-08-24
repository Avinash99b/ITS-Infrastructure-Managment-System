import type {Request, Response} from 'express';
import {UserModel, UserStatus} from '../models/userModel';
import db from "../components/db";
import {z} from 'zod';
import logger from '../components/logger';
import zodErrorMapper from "../components/zodErrorMapper";
import {FileHandler} from '../components/fileHandler';
import path from 'path';
import fs from "fs";


// Zod validation schema
const updatePermissionsSchema = z.object({
    permissionsToKeep: z.array(z.string()),
    userMobileNo: z.string().length(10).regex(/^\d+$/)
});

const updateUserStatusSchema = z.object({
    status: z.enum(UserStatus),
});

// --- Zod schema for query params ---
const getUsersSchema = z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).default(20),
    range: z.string().optional(), // format: "YYYY-MM-DD,YYYY-MM-DD"
    search: z.string().optional(),
    sort: z.string().optional(), // field to sort by
    order: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Zod schema for user ID param
const userIdParamSchema = z.object({
    id: z.coerce.number().min(1)
});

export async function getPermissionsForUser(userId:number){
    const user = await db<UserModel>('users').where({id: userId}).first() as UserModel;
    return user.permissions
}

/**
 * GET /users
 * Fetches users with advanced features:
 *   - Pagination: page & limit
 *   - Filtering: range (created_at)
 *   - Searching: name, email, mobile_no
 *   - Sorting: sort field & order
 *
 * Query parameters:
 *   - page: number (default 1)
 *   - limit: number (default 20)
 *   - range: string, format "YYYY-MM-DD,YYYY-MM-DD" (optional)
 *   - search: string, search by name, email, or mobile_no (optional)
 *   - sort: string, column to sort by (optional)
 *   - order: string, "asc" or "desc" (default "asc")
 *
 * Response:
 *   {
 *     users: UserModel[],
 *     page: number,
 *     limit: number,
 *     total: number
 *   }
 */
export const getUsers = async (req: Request, res: Response) => {
    const parsed = getUsersSchema.safeParse(req.query);
    if (!parsed.success) {
        logger.warn('Invalid getUsers params', { errors: parsed.error.issues, user: req.user?.id });
        return res.status(400).json({ error: 'Invalid params', details: parsed.error.issues });
    }

    const { page, limit, range, search, sort, order } = parsed.data;
    const offset = (page - 1) * limit;

    try {
        // Base query
        let query = db<UserModel>('users').select('*');

        // --- Date range filter ---
        if (range) {
            const [start, end] = range.split(',');
            if (start) query = query.where('created_at', '>=', new Date(start));
            if (end) query = query.where('created_at', '<=', new Date(end));
        }

        // --- Search filter ---
        if (search) {
            query = query.where(function () {
                this.where('name', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`)
                    .orWhere('mobile_no', 'like', `%${search}%`);
            });
        }

        // --- Sorting ---
        if (sort) {
            query = query.orderBy(sort, order);
        }

        // --- Pagination ---
        const users = await query.limit(limit).offset(offset);

        // Remove sensitive info
        const safeUsers = users.map(user => ({ ...user, password_hash: undefined }));

        // --- Total count ---
        let countQuery = db<UserModel>('users');
        if (range) {
            const [start, end] = range.split(',');
            if (start) countQuery = countQuery.where('created_at', '>=', new Date(start));
            if (end) countQuery = countQuery.where('created_at', '<=', new Date(end));
        }
        if (search) {
            countQuery = countQuery.where(function () {
                this.where('name', 'like', `%${search}%`)
                    .orWhere('email', 'like', `%${search}%`)
                    .orWhere('mobile_no', 'like', `%${search}%`);
            });
        }
        const countResult = await countQuery.count<{ count: string }[]>('id as count');
        const total = Number(countResult[0]?.count || 0);

        res.json({ users: safeUsers, page, limit, total });
        logger.info('Fetched users', { user: req.user?.id, page, limit, range, search, sort, order });
    } catch (err) {
        logger.error('Failed to fetch users', { error: err, user: req.user?.id });
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
        if(!req.user?.id)
            return res.status(400).json({error: 'User ID is required'});

        const userPermissions = getPermissionsForUser(req.user?.id);
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
        const user = await db('users').where({id: userId}).first() as UserModel;
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
        const updaterUser = await db('users').where({id: updaterUserId}).first() as UserModel;
        if (!updaterUser) {
            logger.warn('Updater user not found', {user: updaterUserId});
            return res.status(404).json({error: 'Updater user not found'});
        }

        if(updaterUser.mobile_no==userMobileNo){
            logger.warn('Updater user cannot update their own permissions', {user: updaterUserId});
            return res.status(403).json({error: 'You cannot update your own permissions'});
        }

        const userToUpdate = await db('users').where({mobile_no: userMobileNo}).first() as UserModel;
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

/**
 * Updates the status of a specific user.
 * Expects a user ID in the URL parameters and a status in the request body.
 * The user performing the action cannot change their own status.
 * @param req
 * @param res
 */
export const updateUserStatus = async (req: Request, res: Response) => {
    try {
        const { id: userIdToUpdate } = req.params;
        const updaterUserId = req.user?.id;

        if (!updaterUserId) {
            logger.warn('Updater User ID is required for updateUserStatus');
            return res.status(400).json({ error: 'Updater User ID is required' });
        }

        if (parseInt(userIdToUpdate as string, 10) === updaterUserId) {
            logger.warn('User attempted to change their own status', { user: updaterUserId });
            return res.status(403).json({ error: 'You cannot change your own status.' });
        }

        const parsed = updateUserStatusSchema.safeParse(req.body);
        if (!parsed.success) {
            logger.warn('Invalid status update input', { errors: parsed.error.issues, user: updaterUserId });
            return res.status(400).json({ error: 'Invalid input', details: parsed.error.issues.map(zodErrorMapper) });
        }

        const { status } = parsed.data;

        const userToUpdate = await db('users').where({ id: userIdToUpdate }).first();
        if (!userToUpdate) {
            logger.warn('User to update not found', { userIdToUpdate, user: updaterUserId });
            return res.status(404).json({ error: 'User to update not found' });
        }

        await db('users').where({ id: userIdToUpdate }).update({ status });
        logger.info('Updated user status', { user: updaterUserId, updatedUser: userIdToUpdate, newStatus: status });

        res.json({ message: 'User status updated successfully', success: true, userId: userIdToUpdate, status });
    } catch (err) {
        logger.error('Failed to update user status', { error: err, user: req.user?.id });
        res.status(500).json({ error: 'Failed to update user status', details: err });
    }
};

/**
 * GET /users/:id
 * Fetch a user by ID
 *
 * Params:
 *   - id: string (user ID)
 *
 * Response:
 *   {
 *     id: number,
 *     name: string,
 *     email: string,
 *     mobile_no: string,
 *     permissions: string[],
 *     status: string,
 *     created_at: string,
 *     updated_at: string
 *   }
 */
const userIdParamSchemaForGetUserById = z.object({
    id: z.string().regex(/^\d+$/).transform(Number).refine(val => Number.isInteger(val) && val > 0, {
        message: "User ID must be an integer above 0"
    })
});
export const getUserById = async (req: Request, res: Response) => {
    const parsed = userIdParamSchemaForGetUserById.safeParse(req.params);
    if (!parsed.success) {
        logger.warn('Invalid user ID param', { errors: parsed.error.issues, user: req.user?.id });
        return res.status(400).json({ error: 'Invalid user ID', details: parsed.error.issues.map(zodErrorMapper) });
    }
    const { id } = parsed.data;
    try {
        const user = await db<UserModel>('users').where({ id }).first();
        if (!user) {
            logger.info('User not found', { id, user: req.user?.id });
            return res.status(404).json({ error: 'User not found' });
        }
        // Remove sensitive info
        const { password_hash, ...safeUser } = user;
        res.json(safeUser);
        logger.info('Fetched user by ID', { id, user: req.user?.id });
    } catch (err) {
        logger.error('Failed to fetch user by ID', { error: err, id, user: req.user?.id });
        res.status(500).json({ error: 'Failed to fetch user', details: err });
    }
};

/**
 * GET /users/:id/profile
 * Fetches public profile information for a user by ID.
 * No authentication required.
 *
 * Params:
 *   - id: int (user ID)
 *
 * Response:
 *   {
 *     name: string,
 *     image_url: string | null
 *   }
 *
 * Errors:
 *   404: User not found
 */
export const getUserProfile = async (req: Request, res: Response) => {
    // Validate 'id' param using Zod
    const parsed = userIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid user ID', details: parsed.error.issues });
    }
    const { id } = parsed.data;
    try {
        const user = await db('users').select('name', 'image_url').where({ id }).first();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ name: user.name, image_url: user.image_url ?? null });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user profile', details: err });
    }
};

// Zod schema for profile image update
const updateProfileImageSchema = z.object({
    file: z.any()
});



export async function updateUserProfileImage(req: Request, res: Response) {
    try {
        const fileHandler = new FileHandler({visibilityPublic:true,uploadDir:"profileImages"});
        // Multer places file in req.file
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({error: 'Unauthorized'});
        }
        if (!req.file) {
            return res.status(400).json({error: 'No file uploaded'});
        }
        // Validate file type (basic check)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({error: 'Invalid file type'});
        }
        //Delete previous image starting with user_${userId}
        const possibleCombinations = [`user_${userId}.png`, `user_${userId}.jpg`, `user_${userId}.jpeg`]
        for (const combination of possibleCombinations) {
            await fileHandler.deleteFile("profileImages/" + combination);
        }
        // Save file
        const filename = `user_${userId}${path.extname(req.file.originalname)}`;
        await fileHandler.saveFile(filename, req.file.buffer);
        const imageUrl = fileHandler.getFileUrl(filename);
        // Update user in DB
        await db('users').where({id: userId}).update({image_url: imageUrl});
        return res.json({profileImageUrl: imageUrl});
    } catch (err) {
        logger.error('Error updating profile image', err);
        return res.status(500).json({error: 'Internal server error'});
    }
}

// Zod schema for updating username and email
const updateUserSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.email().optional()
});

export const updateCurrentUser = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({error: 'Unauthorized'});
    }
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({error: 'Invalid input', details: parsed.error.issues.map(zodErrorMapper)});
    }
    const { name, email } = parsed.data;
    if (!name && !email) {
        return res.status(400).json({error: 'No fields to update'});
    }
    try {
        await db('users').where({id: userId}).update({
            ...(name && {name}),
            ...(email && {email})
        });
        const updatedUser = await db('users').where({id: userId}).first();
        if (!updatedUser) {
            return res.status(404).json({error: 'User not found'});
        }
        // Remove sensitive info
        updatedUser.password_hash = undefined;
        updatedUser.created_at = undefined;
        updatedUser.updated_at = undefined;
        res.json({user: updatedUser});
    } catch (err) {
        logger.error('Failed to update user', {error: err, user: userId});
        res.status(500).json({error: 'Failed to update user', details: err});
    }
};
