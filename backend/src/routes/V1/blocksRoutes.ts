import {Router} from 'express';
import {
    getBlocks,
    getBlock,
    createBlockHandler,
    updateBlockHandler,
    deleteBlockHandler
} from '../../controllers/blocksController';
import {authenticateToken} from "../../middleware/authMiddleware";
import {requirePermission} from "../../middleware/permissionMiddleware";

const router = Router();

router.get('/', getBlocks);
router.get('/:id', getBlock);
router.post('/', authenticateToken, requirePermission('edit_blocks'), createBlockHandler);
router.put('/:id', authenticateToken, requirePermission('edit_blocks'), updateBlockHandler);
router.delete('/:id', authenticateToken, requirePermission('edit_blocks'), deleteBlockHandler);

export default router;

