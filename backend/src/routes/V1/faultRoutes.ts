// src/routes/faultRoutes.ts
import { Router } from 'express';
import { listFaults, reportFault } from '../../controllers/faultController';
import { requirePermission } from '../../middleware/permissionMiddleware';
import {authenticateToken} from "../../middleware/authMiddleware";

const router = Router();

router.get('/', authenticateToken, requirePermission('view_faults'),listFaults);
router.post('/', authenticateToken,requirePermission('report_faults'), reportFault);

export default router;

