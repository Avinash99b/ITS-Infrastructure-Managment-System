import { Request, Response } from 'express';
import { z } from 'zod';
import logger from '../components/logger'
import db from '../components/db';
import { BlockModel } from '../models/blockModel';
import zodErrorMapper from '../components/zodErrorMapper';

const blockSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    image_url: z.string().url().optional()
});

export async function getBlocks(req: Request, res: Response) {
    try {
        const blocks: BlockModel[] = await db('blocks').select('*');
        res.json(blocks);
    } catch (err) {
        logger.error('Failed to fetch blocks', { error: err });
        res.status(500).json({ error: 'Failed to fetch blocks' });
    }
}

export async function getBlock(req: Request, res: Response) {
    try {
        const block: BlockModel = await db('blocks').where({ id: Number(req.params.id) }).first();
        if (!block) return res.status(404).json({ error: 'Block not found' });
        res.json(block);
    } catch (err) {
        logger.error('Failed to fetch block', { error: err });
        res.status(500).json({ error: 'Failed to fetch block' });
    }
}

export async function createBlockHandler(req: Request, res: Response) {
    const result = blockSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Validation failed', details: result.error.issues.map(zodErrorMapper) });
    }
    try {
        const [block]: BlockModel[] = await db('blocks').insert(result.data).returning('*');
        res.status(201).json(block);
    } catch (err) {
        logger.error('Failed to create block', { error: err });
        res.status(500).json({ error: 'Failed to create block' });
    }
}

export async function updateBlockHandler(req: Request, res: Response) {
    const result = blockSchema.partial().safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Validation failed', details: result.error.issues.map(zodErrorMapper) });
    }
    try {
        const [block]: BlockModel[] = await db('blocks').where({ id: Number(req.params.id) }).update(result.data).returning('*');
        if (!block) return res.status(404).json({ error: 'Block not found' });
        res.json(block);
    } catch (err) {
        logger.error('Failed to update block', { error: err });
        res.status(500).json({ error: 'Failed to update block' });
    }
}

export async function deleteBlockHandler(req: Request, res: Response) {
    try {
        const deleted = await db('blocks').where({ id: Number(req.params.id) }).del();
        if (!deleted) return res.status(404).json({ error: 'Block not found' });
        res.status(204).send();
    } catch (err) {
        logger.error('Failed to delete block', { error: err });
        res.status(500).json({ error: 'Failed to delete block' });
    }
}
