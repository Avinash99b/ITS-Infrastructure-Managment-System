import db from '../components/db';

export interface RoomModel {
    id: number;
    name: string;
    description?: string;
    incharge_id?: number;
    block_id: number;
    floor: number;
    created_at: Date;
    updated_at: Date;
}

// All logic moved to controller. This file only contains the RoomModel interface.
