// src/routes/faultRoutes.ts
import { Router } from 'express';
import { listFaults, reportFault } from '../../controllers/faultController';
import { requirePermission } from '../../middleware/permissionMiddleware';

const router = Router();

router.get('/', requirePermission('view_faults'), listFaults);
router.post('/', requirePermission('report_faults'), reportFault);

export default router;

