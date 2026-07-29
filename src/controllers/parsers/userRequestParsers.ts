import z from 'zod'
import { type Request } from 'express'
import { newUserDetailsSchema, loginAttemptSchema, EmailSchema, userUpdateAttemptSchema, PasswordSchema, passwordUpdateAttemptSchema } from '../../models/User/UserSchemas.js'
import { type NewUserDetails, } from '../../models/User/users.types.js'
import { parseSchema } from '../../utils/utils.js'
import { ValidationError } from '../../models/errors/Errors.js'
import { parseId } from '../../utils/generalUtils.js'

const determineMethod = (val: string): 'email' | 'username' => {
    try {
        parseSchema(EmailSchema, val, 'email')
        return 'email'
    } catch (e) {
        if (!(e instanceof ValidationError)) throw e
        return 'username'
    }
}

export const parseUserId = (body: string | string[] | undefined) => {
    return parseId(body, 'user')
}

export const parseNewUserDetails = (body: Request['body']) => {
    const result = parseSchema(newUserDetailsSchema, body, 'new-user')

    return result.data
}

export const parseUserUpdateAttempt = (body: Request['body']) => {
    const result = parseSchema(userUpdateAttemptSchema, body, 'update-attempt')

    const method: 'email' | 'username' = 'email' in result.data
        ? 'email'
        : 'username'

    const data = 'email' in result.data
        ? result.data.email
        : result.data.username

    return {
        method,
        data
    }
}

export const parseLoginAttempt = (body: Request['body']) => {
    const result = parseSchema(loginAttemptSchema, body, 'login-attempt')

    let method = determineMethod(result.data.identifier)

    return {
        method,
        data: result.data
    }
}

export const parseUserResetAttempt = (body: Request['body']) => {
    const result = parseSchema(passwordUpdateAttemptSchema, body, 'user-password')

    return result.data
}
