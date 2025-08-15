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

/**
 * @swagger
 * /api/v1/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Rooms]
 *     responses:
 *       200:
 *         description: List of rooms
 *   post:
 *     summary: Create a new room
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               blockId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Room created
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.get('/', getAllRooms);
router.post('/', authenticateToken, requirePermission('edit_rooms'), createRoom);

/**
 * @swagger
 * /api/v1/rooms/{id}:
 *   get:
 *     summary: Get room by ID
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Room details
 *       404:
 *         description: Room not found
 *   patch:
 *     summary: Update room by ID
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               blockId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Room updated
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 *       404:
 *         description: Room not found
 *   delete:
 *     summary: Delete room by ID
 *     tags: [Rooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Room deleted
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 *       404:
 *         description: Room not found
 */
router.get('/:id', getRoomById);
router.patch('/:id', authenticateToken, requirePermission('edit_rooms'), updateRoom);
router.delete('/:id', authenticateToken, requirePermission('edit_rooms'), deleteRoom);

export default router;
