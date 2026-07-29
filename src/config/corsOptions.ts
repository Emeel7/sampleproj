import dotenv from 'dotenv'
dotenv.config({ quiet: true })

import allowedOrigins from "./allowedOrigins.js"
import type { CorsOptions } from 'cors'

const allowedEnv = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "production" // ??

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin ?? '') !== -1 || (!origin && allowedEnv)) { // Remove for Development
            callback(null, true)
        } else {
            console.log(origin)
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}

export default corsOptions
