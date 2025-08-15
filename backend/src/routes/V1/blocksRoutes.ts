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

/**
 * @swagger
 * /api/v1/blocks:
 *   get:
 *     summary: Get all blocks
 *     tags: [Blocks]
 *     responses:
 *       200:
 *         description: List of blocks
 *   post:
 *     summary: Create a new block
 *     tags: [Blocks]
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
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Block created
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 */
router.get('/', getBlocks);
router.post('/', authenticateToken, requirePermission('edit_blocks'), createBlockHandler);
/**
 * @swagger
 * /api/v1/blocks/{id}:
 *   get:
 *     summary: Get block by ID
 *     tags: [Blocks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Block details
 *       404:
 *         description: Block not found
 */
router.get('/:id', getBlock);


/**
 * @swagger
 * /api/v1/blocks/{id}:
 *   put:
 *     summary: Update block by ID
 *     tags: [Blocks]
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Block updated
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 *       404:
 *         description: Block not found
 *   delete:
 *     summary: Delete block by ID
 *     tags: [Blocks]
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
 *         description: Block deleted
 *       401:
 *         description: Unauthorized (No token or invalid token)
 *       403:
 *         description: Forbidden (Missing permission)
 *       404:
 *         description: Block not found
 */
router.put('/:id', authenticateToken, requirePermission('edit_blocks'), updateBlockHandler);
/**
 * @swagger
 * /api/v1/blocks/{id}:
 *   delete:
 *     summary: Delete block by ID
 *     tags: [Blocks]
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
 *         description: Block deleted
 *       401:
 *         description: Unauthorized \(No token or invalid token\)
 *       403:
 *         description: Forbidden \(Missing permission\)
 *       404:
 *         description: Block not found
 */
router.delete('/:id', authenticateToken, requirePermission('edit_blocks'), deleteBlockHandler);
export default router;
