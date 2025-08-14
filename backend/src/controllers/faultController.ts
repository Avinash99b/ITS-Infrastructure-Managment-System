// src/controllers/faultController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import db from '../components/db';
import zodErrorMapper from '../components/zodErrorMapper';

const reportFaultSchema = z.object({
  system_disk_serial_no: z.string().min(1, 'System disk serial number is required'),
  fault_name: z.string().min(1, 'Fault name is required'),
  description: z.string().optional(),
});

export const listFaults = async (req: Request, res: Response) => {
  try {
    const faults = await db('faults').select('*');
    res.status(200).json(faults);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch faults', details: error });
  }
};

export const reportFault = async (req: Request, res: Response) => {
  const parseResult = reportFaultSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errors = parseResult.error.issues.map(zodErrorMapper);
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }
  const { system_disk_serial_no, fault_name, description } = parseResult.data;
  const reported_by = req.user?.id;

  try {
    const [id] = await db('fault_reports').insert({
      system_disk_serial_no,
      fault_name,
      description,
      reported_by,
      status: 'pending',
      reported_at: db.fn.now(),
    }).returning('id');

    const report = await db('fault_reports').where({ id }).first();
    res.status(201).json({ message: 'Fault reported successfully', report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to report fault', details: error });
  }
};
