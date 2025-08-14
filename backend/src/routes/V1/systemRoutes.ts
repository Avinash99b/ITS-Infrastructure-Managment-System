// src/routes/systemRoutes.ts
import {Router} from 'express';
import {listSystems, registerSystem, updateSystem, updateSpeed, getSystem} from '../../controllers/systemController';
import {requirePermission} from '../../middleware/permissionMiddleware';
import {authenticateToken} from "../../middleware/authMiddleware";

const router = Router();

router.get('/', listSystems);
router.get('/:disk_serial_no', getSystem);
router.post('/', authenticateToken, requirePermission('edit_systems'), registerSystem);
router.patch('/:disk_serial_no', authenticateToken, requirePermission('edit_systems'), updateSystem);
router.patch('/:disk_serial_no/speed', authenticateToken, requirePermission('edit_systems'), updateSpeed);

export default router;
