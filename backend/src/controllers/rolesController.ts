import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import db from '../components/db';
import logger from '../components/logger';
import zodErrorMapper from '../components/zodErrorMapper';

const roleSchema = z.object({
  name: z.string().min(2),
  permissions: z.array(z.string()),
});

export async function getRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await db('roles').select('*');
    logger.info('Fetched all roles', { user: req.user?.id });
    res.json(roles);
  } catch (err) {
    logger.error('Failed to fetch roles', { error: err, user: req.user?.id });
    next(err);
  }
}

export async function createRole(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = roleSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Role creation validation failed', { errors: parsed.error.issues });
      return res.status(400).json({ errors: parsed.error.issues.map(zodErrorMapper) });
    }
    const { name, permissions } = parsed.data;
    const [role] = await db('roles').insert({ name, permissions: JSON.stringify(permissions) }).returning('*');
    logger.info('Role created', { role });
    res.status(201).json(role);
  } catch (err) {
    logger.error('Failed to create role', { error: err });
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const parsed = roleSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      logger.warn('Role update validation failed', { errors: parsed.error.issues });
      return res.status(400).json({ errors: parsed.error.issues.map(zodErrorMapper) });
    }
    const updateData: any = {};
    if (parsed.data.name) updateData.name = parsed.data.name;
    if (parsed.data.permissions) updateData.permissions = JSON.stringify(parsed.data.permissions);
    const [role] = await db('roles').where({ id }).update(updateData).returning('*');
    if (!role) {
      logger.warn('Role not found for update', { id });
      return res.status(404).json({ error: 'Role not found' });
    }
    logger.info('Role updated', { role });
    res.json(role);
  } catch (err) {
    logger.error('Failed to update role', { error: err });
    next(err);
  }
}

export async function deleteRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const deleted = await db('roles').where({ id }).del();
    if (!deleted) {
      logger.warn('Role not found for deletion', { id });
      return res.status(404).json({ error: 'Role not found' });
    }
    logger.info('Role deleted', { id });
    res.status(204).send();
  } catch (err) {
    logger.error('Failed to delete role', { error: err });
    next(err);
  }
}
