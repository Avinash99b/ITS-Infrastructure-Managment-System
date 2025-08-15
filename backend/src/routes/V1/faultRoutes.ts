// src/routes/faultRoutes.ts
import { Router } from 'express';
import { listFaults, reportFault } from '../../controllers/faultController';
import { requirePermission } from '../../middleware/permissionMiddleware';
import {authenticateToken} from "../../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/v1/faults:
 *   get:
 *     summary: List all faults
 *     tags: [Faults]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of faults
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 *   post:
 *     summary: Report a fault
 *     tags: [Faults]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               systemId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fault reported
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.get('/', authenticateToken, requirePermission('view_faults'),listFaults);
router.post('/', authenticateToken,requirePermission('report_faults'), reportFault);

export default router;
