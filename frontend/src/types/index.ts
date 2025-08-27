

export type User = {
  id: number;
  name: string;
  email: string;
  status: "active" | "inactive" | "suspended";
  image_url: string;
  mobile_no?: string;
  permissions?: string[];
  created_at: string;
  updated_at: string;
};

export type PaginatedUsersResponse = {
  users: User[];
  page: number;
  limit: number;
  total: number;
};

export type Room = {
  id: number;
  name: string;
  description: string;
  incharge_id: number | null;
  block_id: number;
  floor: number | null;
  created_at: string;
  updated_at: string;
};

export type PaginatedRoomsResponse = {
  data: Room[];
  page: number;
  limit: number;
  total: number;
};

export type Block = {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Fault = {
  id: number;
  description: string;
  reported_by: number;
  created_at: string;
  status: "pending" | "in_progress" | "resolved";
  assigned_to?: number | null;
  reporter_name: string;
  reporter_image_url: string | null;
  technician_name?: string | null;
  technician_image_url?: string | null;
  system_disk_serial_no: string;
  fault_name: string;
};

export type FaultType = {
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type PaginatedFaultsResponse = {
    data: Fault[];
    page: number;
    limit: number;
    total: number;
};

export type UserProfile = {
  name: string;
  image_url: string | null;
};

export type System = {
    name: string;
    disk_serial_no: string;
    room_id: number | null;
    status: 'green' | 'orange' | 'red' | null;
    type: 'spare' | 'using' | null;
    upload_speed_mbps: number | null;
    download_speed_mbps: number | null;
    ping_ms: number | null;
    last_reported_at: string | null;
    created_at: string;
    updated_at: string;
}

export type PaginatedSystemsResponse = {
    data: System[];
    page: number;
    limit: number;
    total: number;
}

export type Permission = {
  name: string;
  description: string;
};
