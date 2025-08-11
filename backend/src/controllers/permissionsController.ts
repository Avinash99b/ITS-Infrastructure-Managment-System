import type { Request, Response } from 'express';
import db from '../components/db';
import { z } from 'zod';
import zodErrorMapper from "../components/zodErrorMapper";

const permissionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
});

export const getAllPermissions = async (_req: Request, res: Response) => {
  try {
    const permissions = await db('permissions').select('*');
    res.json(permissions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

export const getPermission = async (req: Request, res: Response) => {
  const { name } = req.params;
  try {
    const permission = await db('permissions').where({ name }).first();
    if (!permission) return res.status(404).json({ error: 'Permission not found' });
    res.json(permission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch permission' });
  }
};

export const createPermission = async (req: Request, res: Response) => {
  const parseResult = permissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json(parseResult.error.issues.map(zodErrorMapper));
  }
  const { name, description } = parseResult.data;
  try {
    await db('permissions').insert({ name, description });
    res.status(201).json({ name, description });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create permission' });
  }
};

export const updatePermission = async (req: Request, res: Response) => {
  const { name } = req.params;
  const parseResult = permissionSchema.partial({ name: true }).safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json(parseResult.error.issues.map(zodErrorMapper));
  }
  const { description } = parseResult.data;
  try {
    const updated = await db('permissions').where({ name }).update({ description });
    if (!updated) return res.status(404).json({ error: 'Permission not found' });
    res.json({ name, description });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update permission' });
  }
};

export const deletePermission = async (req: Request, res: Response) => {
  const { name } = req.params;
  try {
    const deleted = await db('permissions').where({ name }).del();
    if (!deleted) return res.status(404).json({ error: 'Permission not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete permission' });
  }
};

