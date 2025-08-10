import {Router} from 'express';
import {getUsers, getUserPermissions, getUser} from '../../controllers/userController';
import {requirePermission} from "../../middleware/permissionMiddleware";
import {emptyMiddleware} from "../../middleware/emptyMiddleware";
import {authenticateToken} from "../../middleware/authMiddleware";

const isDev = process.env.NODE_ENV === 'development';

const router = Router();

router.get('/', isDev ? emptyMiddleware : authenticateToken,isDev ? emptyMiddleware : requirePermission('admin'), getUsers);

router.get('/me', authenticateToken, getUser);

router.get('/me/permissions', authenticateToken,getUserPermissions);

export default router;
