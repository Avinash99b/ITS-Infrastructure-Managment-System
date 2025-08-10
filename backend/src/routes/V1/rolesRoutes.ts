import { Router } from 'express';
import {getRoles} from '../../controllers/rolesController';

const router = Router();

router.get('/', getRoles);

export default router;

