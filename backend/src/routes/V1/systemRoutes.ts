// src/routes/systemRoutes.ts
import { Router } from 'express';
import { listSystems, registerSystem, updateSystem, updateSpeed } from '../../controllers/systemController';
import { requirePermission } from '../../middleware/permissionMiddleware';

const router = Router();

router.get('/', listSystems);
router.post('/', requirePermission('edit_systems'), registerSystem);
router.patch('/:disk_serial_no', requirePermission('edit_systems'), updateSystem);
router.patch('/:disk_serial_no/speed', requirePermission('edit_systems'), updateSpeed);

export default router;
