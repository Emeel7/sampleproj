import type { Brand } from "../models/base/base.types.js"
import { BadRequestError } from "../models/errors/Errors.js"

// Util Utils LOL (it's not funny)
export const stripUndefinedFields = <T extends Record<string, unknown>>(o: T) => {
    return Object.fromEntries(
        Object.entries(o).filter(([, v]) => v !== undefined)
    )
}

export const throwNonObjects = (o: unknown): Record<string, any> | never => {
    if ((typeof o !== 'object') || o === null || Array.isArray(o)) {
        throw new BadRequestError(`Expected body to be object, received: ${typeof o}`)
    }
    return o
}

// Actual Utils
export const parseId = <K extends string>(id: string | string[] | undefined, brand: K): Brand<string, K> | never => {
    if (Array.isArray(id)) {
        throw new BadRequestError('Invalid ID format')
    }

    if (!id || id.trim() === '') throw new BadRequestError('Missing ID')

    return id as Brand<string, K>
}