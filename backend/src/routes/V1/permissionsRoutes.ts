import { Router } from 'express';
import { getAllPermissions } from '../../controllers/permissionsController';

const router = Router();

router.get('/', getAllPermissions);

export default router;

