// src/routes/faultRoutes.ts
import { Router } from 'express';
import { listFaults, reportFault, listFaultReports } from '../../controllers/faultController';
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
 */
router.get('/', listFaults);

/**
 * @swagger
 * /api/v1/faults:
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
 *               system_disk_serial_no:
 *                 type: string
 *                 description: Disk serial number of the system
 *               fault_name:
 *                 type: string
 *                 description: Name of the fault
 *               description:
 *                 type: string
 *                 description: Optional fault description
 *     responses:
 *       201:
 *         description: Fault reported
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 report:
 *                   type: object
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.post('/', authenticateToken, requirePermission('report_faults'), reportFault);

/**
 * @swagger
 * /api/v1/faults/reports:
 *   get:
 *     summary: List fault reports (paged)
 *     tags: [Fault Reports]
 *     security:
 *       - bearerAuth: []
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
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by fault report status (optional)
 *       - in: query
 *         name: system_disk_serial_no
 *         schema:
 *           type: string
 *         description: Filter by system disk serial number (optional)
 *       - in: query
 *         name: reported_by
 *         schema:
 *           type: string
 *         description: Filter by reporter user ID (optional)
 *     responses:
 *       200:
 *         description: List of fault reports
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.get('/reports', authenticateToken, requirePermission('view_faults'), listFaultReports);

export default router;
