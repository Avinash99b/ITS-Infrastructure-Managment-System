import {Router} from 'express';
import {login, register} from '../../controllers/authController';

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management
 * /api/v1/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobile_no:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Unauthorized
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the user
 *               mobile_no:
 *                 type: string
 *                 description: Mobile number of the user
 *               password:
 *                 type: string
 *                 description: Password for the account
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Invalid request
 */
router.post('/login', login);
router.post('/register', register);

export default router;
