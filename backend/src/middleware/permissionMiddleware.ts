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

export function requireAnyPermission(permissions: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const userPermissions = req.user?.extra_permissions || [];

        // Also check if the user has the wildcard permission
        if (userPermissions.includes("*")) {
            return next(); // User has wildcard permission, proceed to the next middleware
        }

        // Check if any of the user's permissions match the required permissions
        const hasPermission = userPermissions.some((perm: string) => {
            return permissions.includes(perm);
        });

        if (hasPermission) {
            return next(); // User has at least one of the required permissions, proceed to the next middleware
        }
        return res.status(403).json({message: 'Forbidden: missing one of the permissions ' + permissions.join(', ')});
    };
}

export function requireAllPermissions(permissions: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const userPermissions = req.user?.extra_permissions || [];
        // Also check if the user has the wildcard permission
        if (userPermissions.includes("*")) {
            return next(); // User has wildcard permission, proceed to the next middleware
        }

        // Check if all required permissions are present in the user's permissions
        const hasAllPermissions = permissions.every((perm: string) => {
            return userPermissions.includes(perm);
        });
        if (hasAllPermissions) {
            return next(); // User has all required permissions, proceed to the next middleware
        }

        return res.status(403).json({message: 'Forbidden: missing all of the permissions ' + permissions.join(', ')});
    };
}