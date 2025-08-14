import { Router } from 'express';
import userRoutes from './userRoutes';
import systemRoutes from './systemRoutes';
import faultRoutes from './faultRoutes';
import authRoutes from './authRoutes';
import permissionsRoutes from './permissionsRoutes';

const router = Router();

router.use('/users', userRoutes);
router.use('/systems', systemRoutes);
router.use('/faults', faultRoutes);
router.use('/auth', authRoutes);
router.use('/permissions', permissionsRoutes);

export default router;
