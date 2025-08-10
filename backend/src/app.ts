import express, {NextFunction,Request,Response} from 'express';
import ApiVersionRouter from './routes/ApiVersionRouter';
import {RequestError} from "./types/ErrorTypes";

const app = express();

app.use(express.json());
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
