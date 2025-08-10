import type {Request, Response} from 'express';
import {User} from '../models/userModel';
import db from "../components/db";

export const getUsers = async (_req: Request, res: Response) => {
    // Fetch all users from the database
    const users = await db('users').select('*') as User[];

    // Return the list of users
    res.json(users);
};

export const getUserPermissions = (req: Request, res: Response) => {
    const userPermissions = req.user?.extra_permissions || [];
    res.json(userPermissions);
};

export const getUser = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    // Fetch the user by ID
    const user = await db('users').where({id: userId}).first() as User;
    if (!user) {
        return res.status(404).json({error: 'User not found'});
    }

    // Remove sensitive information
    user.password_hash = undefined as any; // Remove password hash
    user.created_at = undefined as any; // Remove created_at timestamp
    user.updated_at = undefined as any; // Remove updated_at timestamp
    user.extra_permissions = req.user?.extra_permissions || [];

    // Return the user details
    res.json(user);
}