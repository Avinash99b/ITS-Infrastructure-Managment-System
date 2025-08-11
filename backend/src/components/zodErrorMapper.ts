import {z} from "zod";

export default function zodErrorMapper(err:z.core.$ZodIssue) {
    return {field: err.path[0], message: err.message}
}