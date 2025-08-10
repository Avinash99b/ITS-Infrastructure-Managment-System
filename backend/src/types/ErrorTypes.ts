export interface RequestError{
    status: number;
    message: string;
    details?: string | Record<string, any>;
    code?: string;
    errors?: Record<string, any>;
    stack?: string;
    cause?: Error | string;
    isOperational?: boolean;
}