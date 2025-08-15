import { Router } from 'express';
import V1Router from './V1/V1Router';

const router = Router();

router.use('/V1', V1Router);

export default router;

