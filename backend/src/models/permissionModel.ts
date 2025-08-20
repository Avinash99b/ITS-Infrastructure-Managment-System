/**
 * @swagger
 * components:
 *   schemas:
 *     PermissionModel:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the permission (e.g., 'create:user').
 *           example: 'view_faults'
 *         description:
 *           type: string
 *           description: A friendly description of what the permission allows.
 *           example: 'Allows the user view the faults.'
 *       required:
 *         - id
 *         - name
 */
export interface Permission {
    name: string;
    description?: string | null;
    created_at?: string;
    updated_at?: string;
}