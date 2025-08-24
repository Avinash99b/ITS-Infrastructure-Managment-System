// src/routes/faultRoutes.ts
import { Router } from 'express';
import {
    listFaults,
    reportFault,
    listFaultReports,
    updateFault,
    assignTechnician
} from '../../controllers/faultController';
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
 * /api/v1/faults/report:
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
router.post('/report',authenticateToken, reportFault);

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


/**
 * @swagger
 * /api/v1/faults/reports/status:
 *   patch:
 *     summary: Update Status of Fault Report
 *     tags: [Fault Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *         required: true
 *         content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: New status for the user (e.g., pneding,in_progress,resolved)
 *     responses:
 *       200:
 *         description: Updating Successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.patch('/report/status',authenticateToken,requirePermission('update_fault_report'),updateFault);


/**
 * @swagger
 * /api/v1/faults/reports/{reportId}/technicianId:
 *   post:
 *     summary: Assign a technician to a fault report
 *     tags: [Fault Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the fault report
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               technicianId:
 *                 type: string
 *                 description: ID of the technician to assign
 *     responses:
 *       200:
 *         description: Technician assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 assignment:
 *                   type: object
 *       400:
 *         description: Invalid request or parameters
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.post('/reports/:reportId/technicianId',authenticateToken,requirePermission('assign_technician'),assignTechnician)

export default router;
