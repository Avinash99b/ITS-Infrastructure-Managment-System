import express, { NextFunction, Request, Response } from 'express';
import ApiVersionRouter from './routes/ApiVersionRouter';
import { RequestError } from "./types/ErrorTypes";
import swaggerJSDoc from "swagger-jsdoc";
import { setup, serve } from "swagger-ui-express";
import * as path from "node:path";
import fs from "fs";
import yaml from "yaml";
import cors from 'cors';
import promBundle from "express-prom-bundle";
import {Registry, collectDefaultMetrics, Counter, Histogram} from "prom-client";

const app = express();

app.use(express.json());
app.use(cors());


// ✅ Expose metrics endpoint
app.get("/api/v1/metrics", async (req, res) => {
    // Get totalRequests from the counter
    const counterValues = await httpRequestCounter.get();
    const totalRequests =
        counterValues.values.reduce((acc, v) => acc + v.value, 0) || 0;

    // Get histogram data for average duration
    const histogramValues = await httpRequestDuration.get();
    // The histogram sum and count are stored in .values with 'sum' and 'count' suffix
    const sumEntry = histogramValues.values.find(v => v.metricName === "http_request_duration_ms_sum");
    const countEntry = histogramValues.values.find(v => v.metricName === "http_request_duration_ms_count");

    const sum = sumEntry?.value || 0;
    const count = countEntry?.value || 0;
    const averageDuration = count > 0 ? sum / count : 0;

    return res.json({
        totalRequests,
        averageDuration
    });
});


// Express-prom-bundle middleware
const metricsMiddleware = promBundle({
    includeMethod: true,
    includePath: true,
    includeStatusCode: true,
    includeUp: true,
    // Only expose metrics on demand, not as a middleware route
    metricsPath: "",
});

// Attach metrics middleware
app.use(metricsMiddleware);

const httpRequestCounter = new Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
});

const httpRequestDuration = new Histogram({
    name: "http_request_duration_ms",
    help: "Duration of HTTP requests in ms",
    buckets: [50, 100, 200, 500, 1000, 2000],
});

// Middleware to track requests
app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on("finish", () => {
        httpRequestCounter.inc();
        end();
    });
    next();
});

// --- Swagger Setup ---
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'ITS API',
            version: '1.0.0',
            description: 'ITS API Documentation',
            contact: {
                name: 'ITS Support',
                email: 'bathulaavi@gmail.com'
            }
        },
        servers: [
            { url: 'http://localhost:3000', description: 'Development Server' },
            { url: 'https://its.api.avinash9.tech', description: 'Production Server' }
        ]
    },
    apis: [
        path.join(__dirname, 'routes/V1/*.ts'),
        path.join(__dirname, 'routes/*.ts'),
        path.join(__dirname, 'models/*.ts')
    ],
};
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', serve, setup(swaggerSpec));
fs.writeFileSync('./swagger.yaml', yaml.stringify(swaggerSpec), 'utf8');
console.log('✅ swagger.yaml generated!');

// --- Static + API ---
app.use('/files', express.static(path.join(__dirname, '../uploads/public')));
app.use('/api', ApiVersionRouter);


// Catch-all 404
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use((err: RequestError, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
});

export default app;
