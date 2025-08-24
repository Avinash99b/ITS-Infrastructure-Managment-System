// src/controllers/faultController.ts
import {Request, Response} from "express";
import {z} from "zod";
import db from "../components/db";
import zodErrorMapper from "../components/zodErrorMapper";
import {FaultReport, FaultReportStatus} from "../models/faultReportModel";
import logger from "../components/logger";
import {UserModel} from "../models/userModel";
import {System} from "../models/systemModel";

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
    technicianId: z.number()
})

const listFaultReportsQuerySchema = z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.string().optional(),
    system_disk_serial_no: z.string().optional(),
    reported_by: z.string().regex(/^\d+$/, 'reported_by must be a valid user id').optional(),
});

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

        //Check if system exists
        const result = await db('systems').where({disk_serial_no:system_disk_serial_no}).first() as System
        if(!result){
            return res.status(404).json({error: "System Not Found"})
        }
        const [insertResult] = await db("fault_reports")
            .insert({
                system_disk_serial_no,
                fault_name,
                description,
                reported_by,
                status: "pending"
            })
            .returning("id");

        const report = await db("fault_reports").where({id:insertResult.id}).first();
        res.status(201).json({message: "Fault reported successfully", report});
    } catch (error) {
        console.log(error)
        res.status(500).json({error: "Failed to report fault", details: error});
    }
};

export const listFaultReports = async (req: Request, res: Response) => {
    // Validate query params
    const parseResult = listFaultReportsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
        const errors = parseResult.error.issues.map(zodErrorMapper);
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const { page = 1, limit = 20, status, system_disk_serial_no, reported_by } = parseResult.data;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const offset = (pageNum - 1) * limitNum;

    try {
        // Build base filters
        const filters: Record<string, any> = {};
        if (status) filters.status = status;
        if (system_disk_serial_no) filters.system_disk_serial_no = system_disk_serial_no;
        if (reported_by) filters.reported_by = reported_by;

        // Count total without joins
        const totalResult = await db("fault_reports").where(filters).count<{ count: number }>("id as count").first();
        const total = Number(totalResult?.count || 0);

        // Fetch data with join
        let query = db("fault_reports")
            .leftJoin("users as reporters", "fault_reports.reported_by", "reporters.id")
            .leftJoin("users as technicians", "fault_reports.technician_id", "technicians.id")
            .select(
                "fault_reports.*",
                db.raw("reporters.id as reporter_id"),
                db.raw("reporters.name as reporter_name"),
                db.raw("reporters.image_url as reporter_image_url"),
                db.raw("technicians.id as technician_id"),
                db.raw("technicians.name as technician_name"),
                db.raw("technicians.image_url as technician_image_url")
            )
            .offset(offset)
            .limit(limitNum)
            .orderBy("fault_reports.reported_at", "desc");

        const data = await query;

        return res.status(200).json({ data, total, page: pageNum, limit: limitNum });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Failed to fetch fault reports", details: String(error) });
    }
};


export const updateFault = async (req: Request, res: Response) => {
    const parseResult = updateFaultSchema.safeParse(req.body);
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
    const parseResult = assignTechnicianSchema.safeParse(req.body);
    if (!parseResult.success) {
        const errors = parseResult.error.issues.map(zodErrorMapper);
        return res
            .status(400)
            .json({error: "Validation failed", details: errors});
    }

    const {technicianId} = parseResult.data;

    const fault_id = Number(req.params.reportId)
    if(!fault_id){
        return res.status(400).json({error:"Fault Id is required"})
    }
    try {
        const faultReportResult = await db("fault_reports").where({id: fault_id}).first() as FaultReport;

        if (!faultReportResult) {
            return res.status(404).json({error: "Fault Report Not Found"})
        }
        const userQueryResult = await db('users').where({id: technicianId}).first() as UserModel

        if (!userQueryResult) {
            return res.status(404).json({error: "User Not Found"})
        }
        await db('fault_reports').where({id: fault_id}).update({technician_id: technicianId})

        return res.status(200).json({status: "success", message: "Successfully Assigned Technician"})
    } catch (error: any) {
        logger.error(error, `Status update for a fault failed, Details:- ${parseResult.data}`)
        res.status(500)
            .json({error: "Failed to fetch fault reports", details: error});
    }
}