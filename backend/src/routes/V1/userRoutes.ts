import {Router} from 'express';
import {
    getUsers,
    getUserPermissions,
    getUser,
    updateUserPermissions,
    getPermissionsByUserId,
    updateUserStatus
} from '../../controllers/userController';
import {requirePermission} from "../../middleware/permissionMiddleware";
import {emptyMiddleware} from "../../middleware/emptyMiddleware";
import {authenticateToken} from "../../middleware/authMiddleware";

const isDev = process.env.NODE_ENV === 'development';

const router = Router();

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.get('/', authenticateToken, requirePermission('view_users'), getUsers);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user details
 *       401:
 *         description: Unauthorized (No token or invalid token)
 */
router.get('/me', authenticateToken, getUser);

/**
 * @swagger
 * /api/v1/users/me/permissions:
 *   get:
 *     summary: Get current user's permissions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions for current user
 *       401:
 *         description: Unauthorized (No token or invalid token)
 */
router.get('/me/permissions', authenticateToken,getUserPermissions);

/**
 * @swagger
 * /api/v1/users/permissions:
 *   patch:
 *     summary: Update user permissions
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Permissions updated
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.patch('/permissions', authenticateToken,requirePermission('grant_permissions'), updateUserPermissions);

/**
 * @swagger
 * /api/v1/users/{id}/permissions:
 *   get:
 *     summary: Get permissions by user ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of permissions for user
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.get('/:id/permissions', authenticateToken, requirePermission('view_users'), getPermissionsByUserId);

/**
 * @swagger
 * /api/v1/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: New status for the user (e.g., active, inactive, suspended)
 *     responses:
 *       200:
 *         description: User status updated
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.patch('/:id/status', authenticateToken, requirePermission('edit_users'), updateUserStatus);


export default router;
