import { Router } from 'express';
import { getAllPermissions } from '../../controllers/permissionsController';

const router = Router();

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [Permissions]
 *     responses:
 *       200:
 *         description: List of permissions
 */
router.get('/', getAllPermissions);

export default router;
