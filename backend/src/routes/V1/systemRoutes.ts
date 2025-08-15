// src/routes/systemRoutes.ts
import {Router} from 'express';
import {listSystems, registerSystem, updateSystem, updateSpeed, getSystem} from '../../controllers/systemController';
import {requirePermission} from '../../middleware/permissionMiddleware';
import {authenticateToken} from "../../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/systems:
 *   get:
 *     summary: List all systems
 *     tags: [Systems]
 *     responses:
 *       200:
 *         description: List of systems
 *   post:
 *     summary: Register a new system
 *     tags: [Systems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               disk_serial_no:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: System registered
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.get('/', listSystems);
router.post('/', authenticateToken, requirePermission('edit_systems'), registerSystem);

/**
 * @swagger
 * /api/v1/systems/{disk_serial_no}:
 *   get:
 *     summary: Get system by disk serial number
 *     tags: [Systems]
 *     parameters:
 *       - in: path
 *         name: disk_serial_no
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: System details
 *       404:
 *         description: System not found
 *   patch:
 *     summary: Update system by disk serial number
 *     tags: [Systems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: disk_serial_no
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: System updated
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 *       404:
 *         description: System not found
 */
router.get('/:disk_serial_no', getSystem);
router.patch('/:disk_serial_no', authenticateToken, requirePermission('edit_systems'), updateSystem);

/**
 * @swagger
 * /api/v1/systems/{disk_serial_no}/speed:
 *   patch:
 *     summary: Update system speed
 *     tags: [Systems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: disk_serial_no
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
 *               speed:
 *                 type: number
 *     responses:
 *       200:
 *         description: Speed updated
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 *       404:
 *         description: System not found
 */
router.patch('/:disk_serial_no/speed', authenticateToken, requirePermission('edit_systems'), updateSpeed);

export default router;
