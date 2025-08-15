import express, {NextFunction,Request,Response} from 'express';
import ApiVersionRouter from './routes/ApiVersionRouter';
import {RequestError} from "./types/ErrorTypes";
import swaggerJSDoc from "swagger-jsdoc";
import {setup,serve} from "swagger-ui-express";
import * as path from "node:path";
import fs from "fs";
import yaml from "yaml";

const app = express();

app.use(express.json());

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
    apis: [path.join(__dirname, 'routes/V1/*.ts'),path.join(__dirname, 'routes/*.ts')], // Path to API docs
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use('/api-docs', serve, setup(swaggerSpec));
// Convert JSON spec to YAML
const yamlSpec = yaml.stringify(swaggerSpec);

// Save to swagger.yaml
fs.writeFileSync('./swagger.yaml', yamlSpec, 'utf8');

console.log('✅ swagger.yaml generated!');

app.use('/api', ApiVersionRouter);

// Catch-all 404 handler
app.use((req, res, next) => {
    res.status(404).json({error: 'Not Found'});
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
