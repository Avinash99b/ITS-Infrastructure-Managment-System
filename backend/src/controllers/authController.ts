import {Request, Response} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../components/db';
import {z} from "zod";
import {UserModel} from "../models/userModel";
import {RoleModel} from "../models/RoleModel";
import zodErrorMapper from "../components/zodErrorMapper";
import mailer from '../components/mailer';
import crypto from 'crypto';

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

const forgotPasswordSchema = z.object({
    mobile_no: z.string().length(10)
});

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
            return res.status(401).json({error: 'User not found'});
        }
        const user = result.rows[0] as UserModel;
        if (!user) {
            return res.status(401).json({error: 'Invalid credentials'});
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({error: 'Invalid credentials'});
        }

        if(user.status!="active"){
            return res.status(401).json({error: 'User is not active, Please Contact admin to unblock account'});
        }
        // Remove password from user object
        user.password_hash = undefined as any;
        const token = jwt.sign({...user,permissions:undefined}, JWT_SECRET, {expiresIn: '1d'});
        res.json({token, user});
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error'});
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
            return res.status(409).json({error: 'Mobile No or Email already exists'});
        }

        // Hash password
        const hashed = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
        // Insert user
        const result = await db.raw(
            'INSERT INTO users (email,name, mobile_no, password_hash,status) VALUES (?,?,?,?,?) RETURNING id, name, mobile_no, email',
            [email,name, mobile_no, hashed,'inactive']
        );
        const newUser = result.rows[0];

        // Find users with grant_permissions or edit_users
        const notifyResult = await db.raw(
            `SELECT email FROM users WHERE permissions @> '["grant_permissions"]' OR permissions @> '["edit_users"]'`
        );
        const emails = notifyResult.rows.map((row: any) => row.email).filter(Boolean);
        if (emails.length > 0) {
            await mailer.sendMail({
                to: emails.join(','),
                subject: 'New User Registration: Action Required',
                text: `A new user has registered and their status is inactive.\n\nName: ${name}\nEmail: ${email}\nMobile: ${mobile_no}\n\nPlease update their status to active if appropriate.`
            });
        }
        res.status(201).json({message:"User Created Successfully"});
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({error: 'Server error'});
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            message: 'Invalid request data',
            errors: validation.error.issues.map(zodErrorMapper)
        });
    }
    const { mobile_no } = validation.data;
    try {
        // Find user by mobile_no
        const result = await db.raw('SELECT * FROM users WHERE mobile_no = ?', [mobile_no]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0] as UserModel;
        if (!user.email) {
            return res.status(400).json({ error: 'User does not have an email address' });
        }
        // Generate random password
        const newPassword = crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const hashed = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
        // Update password in DB
        await db('users').where({ mobile_no }).update({ password_hash: hashed });
        // Send email
        await mailer.sendMail({
            to: user.email,
            subject: 'Your new password',
            text: `Your new password is: ${newPassword}`
        });
        res.json({ message: 'A new password has been sent to your email.' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};
