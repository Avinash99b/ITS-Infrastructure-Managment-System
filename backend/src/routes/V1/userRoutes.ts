import {Router} from 'express';
import {
    getUsers,
    getUserPermissions,
    getUser,
    updateUserPermissions,
    getPermissionsByUserId,
    updateUserStatus,
    getUserById,
    getUserProfile
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
 *     summary: Get all users with advanced filters, search, sorting, and pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of users per page
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           example: "2025-07-01,2025-08-01"
 *         description: Filter users created between two dates (YYYY-MM-DD,YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by name, email, or mobile number
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: "created_at"
 *         description: Field to sort users by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   $ref: '#/components/schemas/UserModel'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 *       500:
 *         description: Internal server error
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
router.get('/:id/permissions', getPermissionsByUserId);



/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponseModel'
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authenticateToken, requirePermission('view_users'), getUserById);

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

/**
 * @swagger
 * /api/v1/users/{id}/profile:
 *   get:
 *     summary: Get public profile information for a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Public profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 image_url:
 *                   type: string
 *                   nullable: true
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/profile', getUserProfile);


export default router;
