// src/middleware/permissionMiddleware.ts
import {Request, Response, NextFunction} from 'express';

export function requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Assume req.user.permissions is an array of strings
        const userPermissions = req.user?.extra_permissions || [];

        //Fetch permissions based on role_id if available

        if (userPermissions.includes(permission) || userPermissions.includes("*")) {
            return next();
        }
        return res.status(403).json({message: 'Forbidden: missing permission ' + permission});
    };
}

