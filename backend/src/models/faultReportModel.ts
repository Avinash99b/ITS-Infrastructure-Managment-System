export enum FaultReportStatus{
    PENDING='pending',
    IN_PROGRESS='in_progress',
    RESOLVED='resolved'
}

export interface FaultReport {
    id: number;
    system_disk_serial_no: string;
    fault_name: string;
    description?: string | null;
    reported_by?: number | null;
    reported_at?: string;
    status: FaultReportStatus;
    technician_id?: number | null;
    resolved_at?: string | null;
    created_at?: string;
    updated_at?: string;
}
