import type z from "zod"
import type { Infer, RemoveKeys } from "../base/base.types.js"
import type { userSchema, userFieldSchemas, newUserDetailsSchema } from "./UserSchemas.js"

export type UserSchemaType = typeof userSchema

export type UserType = z.infer<UserSchemaType>

export type UserFieldTypes = {
    [K in keyof typeof userFieldSchemas]:
    z.infer<(typeof userFieldSchemas)[K]>
}

export type UserQueriableFieldTypes = RemoveKeys<UserFieldTypes, "auth.password">

export type UserUpdatableFieldTypes = RemoveKeys<UserFieldTypes, "auth.password" | "auth.sessionToken">


export type NewUserDetails = Infer<typeof newUserDetailsSchema>

export type UserLoginFieldTypes = Pick<UserFieldTypes, "email" | "username">

