import type z from "zod";
import type { DbDocData, Infer, RemoveKeys } from "../Base/base.types.js";
import type {
  userSchema,
  userFieldSchemas,
  newUserDetailsSchema,
} from "./UserSchemas.js";

export type UserSchemaType = typeof userSchema;

export type UserFieldTypes = {
  [K in keyof typeof userFieldSchemas]: z.infer<(typeof userFieldSchemas)[K]>;
};

export type NewUserDetails = Infer<typeof newUserDetailsSchema>;

export type UserInputType = z.infer<UserSchemaType>;
export type DefaultUserOutputType = Omit<DbDocData<UserSchemaType>, "auth">;
export type FullUserOutputType = DbDocData<UserSchemaType>;
export type IdentifiedUserType = RemoveKeys<
  FullUserOutputType,
  "auth" | "createdAt" | "updatedAt"
> & {
  sessionToken: UserFieldTypes["auth.sessionToken"];
};
export type UserIdentifiableFieldTypes = Pick<
  UserFieldTypes,
  "id" | "auth.sessionToken"
>;

export type UserQueriableFieldTypes = RemoveKeys<
  UserFieldTypes,
  "id" | "auth.password"
>;

export type UserUpdatableFieldTypes = RemoveKeys<
  UserFieldTypes,
  "id" | "auth.password" | "auth.sessionToken"
>;

export type UserLoginFieldTypes = Pick<UserFieldTypes, "email" | "username">;
