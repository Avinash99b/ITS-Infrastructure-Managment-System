/**
 * @swagger
 * components:
 *   schemas:
 *     UserStatus:
 *       type: string
 *       enum:
 *         - active
 *         - inactive
 *         - suspended
 *     UserModel:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         image_url:
 *           type: string
 *         mobile_no:
 *           type: string
 *         password_hash:
 *           type: string
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           $ref: '#/components/schemas/UserStatus'
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - name
 *         - email
 *         - mobile_no
 *         - password_hash
 *         - status
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponseModel:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         image_url:
 *           type: string
 *         email:
 *           type: string
 *         mobile_no:
 *           type: string
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           $ref: '#/components/schemas/UserStatus'
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *       required:
 *         - id
 *         - name
 *         - email
 *         - mobile_no
 *         - status
 */

export enum UserStatus {
    Active = 'active',
    Inactive = 'inactive',
    Suspended = 'suspended'
}


export interface UserModel {
    id: number;
    name: string;
    email: string;
    mobile_no: string;
    password_hash: string;
    image_url:string;
    permissions?: string[];
    status: UserStatus;
    created_at?: Date;
    updated_at?: Date;
}
