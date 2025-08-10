import {Request, Response} from "express";

export const listSystems = async (req: Request, res: Response) => {
    // TODO: Fetch all systems from DB
    res.status(200).json([]);
};

export const registerSystem = async (req: Request, res: Response) => {
    // TODO: Register new system in DB
    res.status(201).json({ message: 'System registered successfully' });
};

export const updateSystem = async (req: Request, res: Response) => {
    // TODO: Update system details in DB
    res.status(200).json({ message: 'System updated successfully' });
};

