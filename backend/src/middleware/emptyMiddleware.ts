import { Request, Response, NextFunction } from 'express';

export function emptyMiddleware(req: Request, res: Response, next: NextFunction) {
  next();
}

