import path from "path"
import { fileURLToPath } from "url"
import fs, { promises as fsPromises } from "fs"

import { type Request, type Response, type NextFunction } from "express"
import { format } from "date-fns"

const getLogMessage = (message: string) => `${format(new Date(), 'yyyyMMdd\tHH:mm:ss')}\t${generateId(20)}\t${message}`

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const logEvents = async (message: string, fileName: string) => {
    if (process.env.NODE_ENV !== "development") return

    const logItem = getLogMessage(message)

    const logsFolder = path.join(__dirname, '../..', 'logs')
    const logFile = path.join(logsFolder, fileName)

    if (!fs.existsSync(logsFolder)) {
        throw new Error('Please provide a path to store logs')
    }

    await fsPromises.appendFile(logFile, logItem)
}

export const logger = (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin ?? 'no-origin'
    const path = req.originalUrl ?? req.url ?? 'unknown-path'

    console.log(`${req.method}\t${origin}\t${path}\n`, process.env.NODE_ENV)
    logEvents(`${req.method}\t${origin}\t${path}\n`, 'requestLogs.log')
    next()
}

function generateId(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}
