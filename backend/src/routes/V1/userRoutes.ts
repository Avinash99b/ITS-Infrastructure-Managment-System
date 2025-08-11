import {Router} from 'express';
import {getUsers, getUserPermissions, getUser, updateUserPermissions} from '../../controllers/userController';
import {requireAnyPermission, requirePermission} from "../../middleware/permissionMiddleware";
import {emptyMiddleware} from "../../middleware/emptyMiddleware";
import {authenticateToken} from "../../middleware/authMiddleware";

const isDev = process.env.NODE_ENV === 'development';

const router = Router();

router.get('/', isDev ? emptyMiddleware : authenticateToken,isDev ? emptyMiddleware : requirePermission('admin'), getUsers);

router.get('/me', authenticateToken, getUser);

router.get('/me/permissions', authenticateToken,getUserPermissions);

router.patch('/me/permissions', authenticateToken,requireAnyPermission(['grant_permissions','admin']), updateUserPermissions);


export default router;
