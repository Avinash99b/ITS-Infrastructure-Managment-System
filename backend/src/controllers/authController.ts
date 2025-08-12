import {Request, Response} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../components/db';
import {z} from "zod";
import {User} from "../models/userModel";
import {RoleModel} from "../models/RoleModel";
import zodErrorMapper from "../components/zodErrorMapper";

const PASSWORD_SALT_ROUNDS = process.env.PASSWORD_SALT_ROUNDS ? parseInt(process.env.PASSWORD_SALT_ROUNDS) : 10;
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

const registrationValidations = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.email("Email is not valid"),
    mobile_no: z.string().min(10, 'Mobile number must be at least 10 characters').max(15, 'Mobile number must be at most 15 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters')
})

const loginValidations = z.object({
    mobile_no: z.string().min(10, 'Mobile number must be at least 10 characters').max(15, 'Mobile number must be at most 15 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters')
})

export const login = async (req: Request, res: Response) => {

    // Validate request body
    const validation = loginValidations.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            message: 'Invalid request data',
            errors: validation.error.issues.map(zodErrorMapper)
        });
    }
    const {mobile_no, password} = validation.data;

    try {
        const result = await db.raw('SELECT * FROM users WHERE mobile_no = ?', [mobile_no]);
        if (result.rows.length === 0) {
            return res.status(401).json({message: 'User not found'});
        }
        const user = result.rows[0] as User;
        if (!user) {
            return res.status(401).json({message: 'Invalid credentials'});
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        // Remove password from user object
        user.password_hash = undefined as any;
        const token = jwt.sign(user, JWT_SECRET, {expiresIn: '1d'});
        res.json({token, user});
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({message: 'Server error', error: err});
    }
};

export const register = async (req: Request, res: Response) => {
    // Validate request body
    const validation = registrationValidations.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            message: 'Invalid request data',
            errors: validation.error.issues.map(zodErrorMapper)
        });
    }
    const {email,name, mobile_no, password} = validation.data;

    try {
        // Check if user already exists
        const existing = await db.raw('SELECT * FROM users WHERE mobile_no = ? OR email=?', [mobile_no,email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({message: 'User already exists'});
        }

        // Hash password
        const hashed = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
        // Insert user
        const result = await db.raw(
            'INSERT INTO users (email,name, mobile_no, password_hash) VALUES (?,?,?,?) RETURNING id, name, mobile_no',
            [email,name, mobile_no, hashed]
        );
        const user = result.rows[0];
        // Remove password from user object
        delete user.password;
        const token = jwt.sign(user, JWT_SECRET, {expiresIn: '1d'});
        res.status(201).json({token, user});
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({message: 'Server error', error: err});
    }
};
