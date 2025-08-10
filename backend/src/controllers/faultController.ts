// src/controllers/faultController.ts
import { Request, Response } from 'express';

export const listFaults = async (req: Request, res: Response) => {
  // TODO: Fetch all faults from DB
  res.status(200).json([]);
};

export const reportFault = async (req: Request, res: Response) => {
  // TODO: Save fault report in DB
  res.status(201).json({ message: 'Fault reported successfully' });
};

