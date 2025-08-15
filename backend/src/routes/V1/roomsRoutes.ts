import {Router} from 'express';
import {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
} from '../../controllers/roomsController';
import {authenticateToken} from "../../middleware/authMiddleware";
import {requirePermission} from "../../middleware/permissionMiddleware";

const router = Router();

router.get('/', getAllRooms);
router.get('/:id', getRoomById);
router.post('/', authenticateToken, requirePermission('edit_rooms'), createRoom);
router.patch('/:id', authenticateToken, requirePermission('edit_rooms'), updateRoom);
router.delete('/:id', authenticateToken, requirePermission('edit_rooms'), deleteRoom);

export default router;

