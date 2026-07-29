import { logEvents } from './EventLogger.js'
import { type Request, type Response, type NextFunction } from 'express'
import { AppError } from '../models/errors/Errors.js'

const errorLogger = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
    logEvents(`${err.name}:\t ${err.message}\t${req.method}\t${req.headers.origin}\t${req.url}\n`, 'errLog.log')

    process.env.NODE_ENV === 'development' && console.error(err.stack)

    const errorCode = err instanceof AppError ? err.statusCode : 500
    const errorMessage = err instanceof AppError ? err.message : 'Internal Server Error'
    const errorInstance = err instanceof AppError ? err.name : 'InternalServerError'

    const errorBody = {
        name: errorInstance,
        message: errorMessage,
        statusCode: errorCode,
    }

    return res.status(errorCode).json(errorBody)
}


export default errorLogger