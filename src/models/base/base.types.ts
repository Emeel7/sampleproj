import admin from 'firebase-admin'
import { z } from 'zod'

export type Infer<T extends z.ZodType> = z.infer<T>

export type AtLeastOne<T> = {
    [K in keyof T]: Pick<T, K>
}[keyof T] & Partial<T>

export type DocSnapType = admin.firestore.DocumentSnapshot<admin.firestore.DocumentData, admin.firestore.DocumentData>

export type Metadata = {
    createdAt: admin.firestore.Timestamp,
    updatedAt: admin.firestore.Timestamp
}

export type Coredata = {
    id: string
}

export type DbDocData<T extends z.ZodType> =
    Infer<T> & Metadata;

export type DbDocType<
    T extends z.ZodType,
    $strip extends keyof Infer<T> = never
> = Coredata &
    ([$strip] extends [never]
        ? DbDocData<T>
        : Omit<DbDocData<T>, $strip>);


export type ColRefType = admin.firestore.CollectionReference<admin.firestore.DocumentData, admin.firestore.DocumentData>
export type DocRefType = admin.firestore.DocumentReference<admin.firestore.DocumentData, admin.firestore.DocumentData>

export type Brand<K, T extends string> = K & {
    readonly __brand: T
}

export type Parsed<T extends z.ZodType, B extends string> = Brand<Infer<T>, `parsed-${B}`>
export type ParsedPartial<T extends z.ZodType, B extends string> = Brand<AtLeastOne<Infer<T>>, `parsed-${B}`>

export type SchemaParseOptions = {
    partial?: boolean;
    throwOnFail?: boolean
}

export type RemoveKeys<T, K extends keyof T> = {
    [P in keyof T as P extends K ? never : P]: T[P]
};

export type FirebaseQueryType = FirebaseFirestore.Query<FirebaseFirestore.DocumentData, FirebaseFirestore.DocumentData>