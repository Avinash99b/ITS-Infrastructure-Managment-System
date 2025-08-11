import db from '../components/db';
import {Request, Response} from "express";
import {z} from 'zod';
import logger from '../components/logger';
import zodErrorMapper from "../components/zodErrorMapper";

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

export const listSystems = async (req: Request, res: Response) => {
    try {
        const systems = await db('systems').select('*');
        logger.info('Listed all systems', {user: req.user?.id});
        res.status(200).json(systems);
    } catch (err) {
        logger.error('Failed to fetch systems', {error: err, user: req.user?.id});
        res.status(500).json({error: 'Failed to fetch systems', details: err});
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
