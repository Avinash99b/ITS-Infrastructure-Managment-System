// src/controllers/faultController.ts
import {Request, Response} from "express";
import {z} from "zod";
import db from "../components/db";
import zodErrorMapper from "../components/zodErrorMapper";
import {FaultReport, FaultReportStatus} from "../models/faultReportModel";
import {ca, id} from "zod/v4/locales/index.cjs";
import logger from "../components/logger";
import {UserModel} from "../models/userModel";

const reportFaultSchema = z.object({
    system_disk_serial_no: z
        .string()
        .min(1, "System disk serial number is required"),
    fault_name: z.string().min(1, "Fault name is required"),
    description: z.string().optional(),
});

const updateFaultSchema = z.object({
    fault_id: z.number(),
    status: z.enum(FaultReportStatus)
});


const assignTechnicianSchema = z.object({
    technician_user_id: z.number(),
    fault_id: z.number()
})

export const listFaults = async (req: Request, res: Response) => {
    try {
        const faults = await db("faults").select("*");
        res.status(200).json(faults);
    } catch (error) {
        res.status(500).json({error: "Failed to fetch faults", details: error});
    }
};

export const reportFault = async (req: Request, res: Response) => {
    const parseResult = reportFaultSchema.safeParse(req.body);
    if (!parseResult.success) {
        const errors = parseResult.error.issues.map(zodErrorMapper);
        return res
            .status(400)
            .json({error: "Validation failed", details: errors});
    }
    const {system_disk_serial_no, fault_name, description} = parseResult.data;
    const reported_by = req.user?.id;

    try {
        const [id] = await db("fault_reports")
            .insert({
                system_disk_serial_no,
                fault_name,
                description,
                reported_by,
                status: "pending",
                reported_at: db.fn.now(),
            })
            .returning("id");

        const report = await db("fault_reports").where({id}).first();
        res.status(201).json({message: "Fault reported successfully", report});
    } catch (error) {
        res.status(500).json({error: "Failed to report fault", details: error});
    }
};

export const listFaultReports = async (req: Request, res: Response) => {
    // Paging
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Filtering
    const status = req.query.status as string | undefined;
    const system_disk_serial_no = req.query.system_disk_serial_no as
        | string
        | undefined;
    const reported_by = req.query.reported_by as string | undefined;

    try {
        let query = db("fault_reports");
        if (status) query = query.where("status", status);
        if (system_disk_serial_no)
            query = query.where("system_disk_serial_no", system_disk_serial_no);
        if (reported_by) query = query.where("reported_by", reported_by);

        const total = await query
            .clone()
            .count("* as count")
            .first()
            .then((r) => r?.count || 0);
        const data = await query
            .clone()
            .offset(offset)
            .limit(limit)
            .orderBy("reported_at", "desc");

        res.status(200).json({data, total, page, limit});
    } catch (error) {
        res
            .status(500)
            .json({error: "Failed to fetch fault reports", details: error});
    }
};

export const updateFault = async (req: Request, res: Response) => {
    const parseResult = updateFaultSchema.safeParse(req);
    if (!parseResult.success) {
        const errors = parseResult.error.issues.map(zodErrorMapper);
        return res
            .status(400)
            .json({error: "Validation failed", details: errors});
    }

    const {fault_id, status} = parseResult.data;

    try {

        await db('fault_reports').where({id: fault_id}).update({status})
        res.status(200).json({
            status: "success",
            message: "Fault Report Status updated Successfully",
            newStatus: status
        })
    } catch (error: any) {
        logger.error(error, `Status update for a fault failed, Details:- ${parseResult.data}`)
        res.status(500)
            .json({error: "Failed to fetch fault reports", details: error});
    }


};


export const assignTechnician = async (req: Request, res: Response) => {
    const parseResult = assignTechnicianSchema.safeParse(req);
    if (!parseResult.success) {
        const errors = parseResult.error.issues.map(zodErrorMapper);
        return res
            .status(400)
            .json({error: "Validation failed", details: errors});
    }

    const {technician_user_id, fault_id} = parseResult.data;

    try {
        const faultReportResult = await db("fault_reports").where({id: fault_id}).first() as FaultReport;

        if (!faultReportResult) {
            return res.status(404).json({error: "Fault Report Not Found"})
        }
        const userQueryResult = await db('users').where({id: technician_user_id}).first() as UserModel

        if (!userQueryResult) {
            return res.status(404).json({error: "User Not Found"})
        }
        await db('fault_reports').where({id: fault_id}).update({technician_id: technician_user_id})

        return res.status(200).json({status: "success", message: "Successfully Assigned Technician"})
    } catch (error: any) {
        logger.error(error, `Status update for a fault failed, Details:- ${parseResult.data}`)
        res.status(500)
            .json({error: "Failed to fetch fault reports", details: error});
    }
}