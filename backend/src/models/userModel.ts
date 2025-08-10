export interface User {
  id: number;
  name: string;
  email: string;
  mobile_no: string;
  password_hash: string;
  role_id?: number | null;
  extra_permissions?: string[];
  created_at?: Date;
  updated_at?: Date;
}

export interface RequestUserModel extends User {
    total_permissions?: string[];
}