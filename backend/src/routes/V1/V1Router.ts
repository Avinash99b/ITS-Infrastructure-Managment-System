import { Router } from 'express';
import userRoutes from './userRoutes';
import systemRoutes from './systemRoutes';
import faultRoutes from './faultRoutes';
import authRoutes from './authRoutes';
import permissionsRoutes from './permissionsRoutes';
import roomsRoutes from './roomsRoutes';
import blocksRoutes from './blocksRoutes';

const router = Router();

router.use('/users', userRoutes);
router.use('/systems', systemRoutes);
router.use('/faults', faultRoutes);
router.use('/auth', authRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/rooms', roomsRoutes);
router.use('/blocks', blocksRoutes);

export default router;
