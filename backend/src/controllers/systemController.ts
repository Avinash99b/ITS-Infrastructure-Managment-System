import db from '../components/db';
import {Request, Response} from "express";
import {z} from 'zod';
import logger from '../components/logger';
import zodErrorMapper from "../components/zodErrorMapper";
import {SystemStatuses, SystemTypes} from "../models/systemModel";

const registerSystemSchema = z.object({
    disk_serial_no: z.string(),
    room_id: z.number().int().nullable().optional(),
    type: z.enum(['spare', 'using']),
    status: z.enum(['green', 'orange', 'red'])
});

const updateSystemSchema = z.object({
    room_id: z.number().int().nullable().optional(),
    type: z.enum(['spare', 'using']).optional(),
    status: z.enum(['green', 'orange', 'red']).optional(),
    faulty_parts: z.array(z.string()).optional(),
    upload_speed_mbps: z.number().optional(),
    download_speed_mbps: z.number().optional(),
    ping_ms: z.number().optional(),
    last_reported_at: z.string().optional()
});

const updateSpeedSchema = z.object({
    upload_speed_mbps: z.number().optional(),
    download_speed_mbps: z.number().optional(),
    ping_ms: z.number().optional()
});

const listSystemsQuerySchema = z.object({
    page: z.string().regex(/^[\d]+$/).transform(Number).optional(),
    limit: z.string().regex(/^[\d]+$/).transform(Number).optional(),
    room_id: z.string().regex(/^[\d]+$/).transform(Number).optional(),
    status: z.enum([...SystemStatuses]).optional(),
    type: z.enum([...SystemTypes]).optional(),
    search: z.string().optional() // Added search param
});

export const listSystems = async (req: Request, res: Response) => {
    try {
        // Validate query params
        const parsed = listSystemsQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            logger.warn('Invalid listSystems query params', {errors: parsed.error.issues, user: req.user?.id});
            return res.status(400).json({
                error: 'Invalid query parameters',
                details: parsed.error.issues.map(zodErrorMapper)
            });
        }
        const {page = 1, limit = 20, room_id, status, type, search} = parsed.data;
        const offset = (page - 1) * limit;

        // Filters
        let query = db('systems').select('*');
        if (room_id !== undefined) {
            query = query.where('room_id', room_id);
        }
        if (status !== undefined) {
            query = query.where('status', status);
        }
        if (type !== undefined) {
            query = query.where('type', type);
        }
        if (search !== undefined && search.trim() !== '') {
            query = query.where(function() {
                this.where('disk_serial_no', 'like', `%${search}%`)
                    .orWhere('type', 'like', `%${search}%`)
                    .orWhere('status', 'like', `%${search}%`);
            });
        }

        // Get total count for pagination
        const countQuery = db('systems');
        if (room_id !== undefined) countQuery.where('room_id', room_id);
        if (status !== undefined) countQuery.where('status', status);
        if (type !== undefined) countQuery.where('type', type);
        if (search !== undefined && search.trim() !== '') {
            countQuery.where(function() {
                this.where('disk_serial_no', 'like', `%${search}%`)
                    .orWhere('type', 'like', `%${search}%`)
                    .orWhere('status', 'like', `%${search}%`);
            });
        }
        const countResult = await countQuery.count('disk_serial_no as count');
        const total = countResult[0]?.count ? Number(countResult[0].count) : 0;

        // Get paginated results
        const systems = await query.offset(offset).limit(limit);
        logger.info('Listed systems', {user: req.user?.id, filters: req.query});
        res.status(200).json({
            data: systems,
            page,
            limit,
            total
        });
    } catch (err) {
        logger.error('Failed to fetch systems', {error: err, user: req.user?.id});
        res.status(500).json({error: 'Failed to fetch systems', details: err});
    }
};

// Get system by disk_serial_no
export const getSystem = async (req: Request, res: Response) => {
    try {
        const {disk_serial_no} = req.params;
        const system = await db('systems').where('disk_serial_no', disk_serial_no).first();
        if (!system) {
            logger.warn('System not found', {disk_serial_no, user: req.user?.id});
            return res.status(404).json({error: 'System not found'});
        }
        logger.info('Fetched system', {disk_serial_no, user: req.user?.id});
        res.status(200).json(system);
    } catch (err) {
        logger.error('Failed to fetch system', {error: err, user: req.user?.id});
        res.status(500).json({error: 'Failed to fetch system', details: err});
    }
};

export const registerSystem = async (req: Request, res: Response) => {
    try {
        const parsed = registerSystemSchema.safeParse(req.body);
        if (!parsed.success) {
            logger.warn('Invalid system registration input', {errors: parsed.error.issues, user: req.user?.id});
            return res.status(400).json({
                error: 'Invalid input',
                details: parsed.error.issues.map(zodErrorMapper)
            });
        }
        const {disk_serial_no, room_id, type, status} = parsed.data;

        //Check if system already exists
        const existingSystem = await db('systems').where({disk_serial_no}).first();
        if (existingSystem) {
            logger.warn('System already exists', {disk_serial_no, user: req.user?.id});
            return res.status(409).json({error: 'System already exists'});
        }
        //Check if room exists
        if (room_id !== undefined) {
            const roomExists = await db('rooms').where({id: room_id}).first();
            if (!roomExists) {
                logger.warn('Room not found for system registration', {room_id, user: req.user?.id});
                return res.status(404).json({error: 'Room not found'});
            }
        }
        await db('systems').insert({
            disk_serial_no,
            room_id,
            type,
            status
        });
        logger.info('Registered new system', {disk_serial_no, user: req.user?.id});
        res.status(201).json({message: 'System registered successfully'});
    } catch (err) {
        logger.error('Failed to register system', {error: err, user: req.user?.id});
        res.status(500).json({error: 'Failed to register system', details: err});
    }
};

export const updateSystem = async (req: Request, res: Response) => {
    try {
        const {disk_serial_no} = req.params;
        const parsed = updateSystemSchema.safeParse(req.body);
        if (!parsed.success) {
            logger.warn('Invalid system update input', {errors: parsed.error.issues, user: req.user?.id});
            return res.status(400).json({
                error: 'Invalid input',
                details: parsed.error.issues.map(zodErrorMapper)
            });
        }
        const updateFields = parsed.data;
        if (Object.keys(updateFields).length === 0) {
            logger.warn('No fields to update for system', {disk_serial_no, user: req.user?.id});
            return res.status(400).json({error: 'No fields to update'});
        }
        const [current] = await db('systems').where({disk_serial_no});
        if (!current) {
            logger.warn('System not found for update', {disk_serial_no, user: req.user?.id});
            return res.status(404).json({error: 'System not found'});
        }
        // Check if room exists if room_id is being updated
        if (updateFields.room_id !== undefined) {
            //If room_id is 0 , it means the system is not assigned to any room
            if (updateFields.room_id === 0) {
                updateFields.room_id = null; // Set to null if room_id is 0

            } else {
                const roomExists = await db('rooms').where({id: updateFields.room_id}).first();
                if (!roomExists) {
                    logger.warn('Room not found for system update', {
                        room_id: updateFields.room_id,
                        user: req.user?.id
                    });
                    return res.status(404).json({error: 'Room not found'});
                }
            }
        }

        const finalUpdate = {...current, ...Object.fromEntries(Object.entries(updateFields).filter(([_, v]) => v !== undefined))};
        await db('systems')
            .where({disk_serial_no})
            .update(finalUpdate);
        logger.info('Updated system', {disk_serial_no, user: req.user?.id, updatedFields: Object.keys(updateFields)});
        res.status(200).json({message: 'System updated successfully'});
    } catch (err) {
        logger.error('Failed to update system', {error: err, user: req.user?.id});
        res.status(500).json({error: 'Failed to update system', details: err});
    }
};

export const updateSpeed = async (req: Request, res: Response) => {
    try {
        const {disk_serial_no} = req.params;
        const parsed = updateSpeedSchema.safeParse(req.body);
        if (!parsed.success) {
            logger.warn('Invalid speed update input', {errors: parsed.error.issues, user: req.user?.id});
            return res.status(400).json({
                error: 'Invalid input',
                details: parsed.error.issues.map(zodErrorMapper)
            });
        }
        const [current] = await db('systems').where({disk_serial_no});
        if (!current) {
            logger.warn('System not found for speed update', {disk_serial_no, user: req.user?.id});
            return res.status(404).json({error: 'System not found'});
        }
        const {upload_speed_mbps, download_speed_mbps, ping_ms} = parsed.data;
        const finalUpdate = {
            upload_speed_mbps: upload_speed_mbps !== undefined ? upload_speed_mbps : current.upload_speed_mbps,
            download_speed_mbps: download_speed_mbps !== undefined ? download_speed_mbps : current.download_speed_mbps,
            ping_ms: ping_ms !== undefined ? ping_ms : current.ping_ms
        };
        await db('systems')
            .where({disk_serial_no})
            .update(finalUpdate);
        logger.info('Updated system speed', {
            disk_serial_no,
            user: req.user?.id,
            updatedFields: Object.keys(parsed.data)
        });
        res.status(200).json({message: 'Speed updated successfully'});
    } catch (err) {
        logger.error('Failed to update speed', {error: err, user: req.user?.id});
        res.status(500).json({error: 'Failed to update speed', details: err});
    }
};
