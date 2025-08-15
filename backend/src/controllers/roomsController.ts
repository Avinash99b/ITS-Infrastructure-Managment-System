import {Request, Response} from 'express';
import db from '../components/db';
import {z} from 'zod';
import zodErrorMapper from '../components/zodErrorMapper';
import logger from "../components/logger";

const roomSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    incharge_id: z.number().int().nullable().optional(),
    block_id: z.number().int(),
    floor: z.number().int(),
});

export async function getAllRooms(req: Request, res: Response) {
    try {
        // Parse query params
        const {
            page = '1',
            limit = '10',
            block_id,
            floor,
            incharge_id
        } = req.query;

        const pageNum = Math.max(Number(page), 1);
        const limitNum = Math.max(Number(limit), 1);
        const offset = (pageNum - 1) * limitNum;

        // Build query
        let query = db('rooms');
        let countQuery = db('rooms');

        if (block_id) {
            query = query.where('block_id', block_id);
            countQuery = countQuery.where('block_id', block_id);
        }
        if (floor) {
            query = query.where('floor', floor);
            countQuery = countQuery.where('floor', floor);
        }
        if (incharge_id) {
            query = query.where('incharge_id', incharge_id);
            countQuery = countQuery.where('incharge_id', incharge_id);
        }

        // Get total count
        const countResult = await countQuery.count('* as count');
        const total = countResult && countResult[0] ? Number(countResult[0].count) : 0;

        // Get paginated data
        const rooms = await query.offset(offset).limit(limitNum).select('*');

        res.json({
            data: rooms,
            total,
            page: pageNum,
            limit: limitNum
        });
    } catch (err) {
        logger.error('Failed to fetch rooms', {error: err});
        res.status(500).json({error: 'Failed to fetch rooms'});
    }
}

export async function getRoomById(req: Request, res: Response) {
    try {
        const room = await db('rooms').where({id: Number(req.params.id)}).first();
        if (!room) return res.status(404).json({error: 'Room not found'});
        res.json(room);
    } catch (err) {
        logger.error('Failed to fetch room', {error: err});
        res.status(500).json({error: 'Failed to fetch room'});
    }
}

export async function createRoom(req: Request, res: Response) {
    const result = roomSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({error: 'Validation failed', details: result.error.issues.map(zodErrorMapper)});
    }
    try {
        // Check if block_id exists
        const blockExists = await db('blocks').where({id: result.data.block_id}).first()
        if (!blockExists) {
            return res.status(400).json({error: 'Block does not exist'});
        }

        // Check if incharge_id exists if provided
        if (result.data.incharge_id !== null) {
            const inchargeExists = await db('users').where({id: result.data.incharge_id}).first();
            if (!inchargeExists) {
                return res.status(400).json({error: 'Incharge user does not exist'});
            }
        }

        const [room] = await db('rooms').insert(result.data).returning('*');
        res.status(201).json(room);
    } catch (err) {
        logger.error('Failed to create room', {error: err});
        res.status(400).json({error: 'Failed to create room'});
    }
}

export async function updateRoom(req: Request, res: Response) {
    const result = roomSchema.partial().safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({error: 'Validation failed', details: result.error.issues.map(zodErrorMapper)});
    }
    try {
        const [room] = await db('rooms').where({id: Number(req.params.id)}).update(result.data).returning('*');
        if (!room) return res.status(404).json({error: 'Room not found'});
        res.json(room);
    } catch (err) {
        logger.error('Failed to update room', {error: err});
        res.status(400).json({error: 'Failed to update room'});
    }
}

export async function deleteRoom(req: Request, res: Response) {
    try {
        const deleted = await db('rooms').where({id: Number(req.params.id)}).del();
        if (!deleted) return res.status(404).json({error: 'Room not found'});
        res.json({success: true});
    } catch (err) {
        logger.error('Failed to delete room', {error: err});
        res.status(400).json({error: 'Failed to delete room'});
    }
}
