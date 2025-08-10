import { Request, Response, NextFunction } from 'express';
import db from '../components/db';

export async function getRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const levels = await db('roles').select('*');
    res.json(levels);
  } catch (err) {
    next(err);
  }
}

