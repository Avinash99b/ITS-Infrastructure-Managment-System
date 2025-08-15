export interface User {
  id: number;
  name: string;
  email: string;
  mobile_no: string;
  password_hash: string;
  permissions?: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface ResponseUserModel extends User {
    total_permissions?: string[];
}