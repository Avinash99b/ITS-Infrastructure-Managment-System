// src/routes/systemRoutes.ts
import { Router } from 'express';
import { listSystems, registerSystem, updateSystem } from '../../controllers/systemController';
import { requirePermission } from '../../middleware/permissionMiddleware';

const router = Router();

router.get('/', requirePermission('view_systems'), listSystems);
router.post('/', requirePermission('edit_systems'), registerSystem);
router.patch('/:disk_serial_no', requirePermission('edit_systems'), updateSystem);

export default router;

