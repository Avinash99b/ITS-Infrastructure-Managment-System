export type SystemType = 'spare' | 'using';
export type SystemStatus = 'green' | 'orange' | 'red';

export interface System {
  disk_serial_no: string;
  room_id?: number | null;
  type: SystemType;
  status: SystemStatus;
  faulty_parts: string[];
  upload_speed_mbps?: number | null;
  download_speed_mbps?: number | null;
  ping_ms?: number | null;
  last_reported_at?: string;
  created_at?: string;
  updated_at?: string;
}

