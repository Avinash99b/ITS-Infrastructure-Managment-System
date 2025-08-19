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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page (optional)
 *       - in: query
 *         name: room_id
 *         schema:
 *           type: integer
 *         description: Filter by room ID (optional)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [green, orange, red]
 *         description: Filter by system status (optional)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [spare, using]
 *         description: Filter by system type (optional)
 *     responses:
 *       200:
 *         description: List of systems
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *       400:
 *         description: Invalid query parameters
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
 *         description: System speed updated
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 *       404:
 *         description: System not found
 */

router.get('/', listSystems);
router.post('/', authenticateToken, requirePermission('edit_systems'), registerSystem);
router.get('/:disk_serial_no', getSystem);
router.patch('/:disk_serial_no', authenticateToken, requirePermission('edit_systems'), updateSystem);
router.patch('/:disk_serial_no/speed', authenticateToken, requirePermission('edit_systems'), updateSpeed);

export default router;
