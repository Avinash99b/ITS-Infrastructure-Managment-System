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
    permissions?: string[];
    status: UserStatus;
    created_at?: Date;
    updated_at?: Date;
}
