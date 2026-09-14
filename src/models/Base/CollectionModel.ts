import admin from "firebase-admin";

import {
  DocumentNotFoundError,
  BadRequestError,
  ConflictError,
} from "../errors/Errors.js";
import { z } from "zod";
import { stripUndefinedFields } from "../../utils/generalUtils.js";

// Useful Types
import {
  type DbDocData,
  type DocSnapType,
  type Parsed,
  type ParsedPartial,
} from "./base.types.js";
import {
  isFirestoreError,
  parseObjectPartial,
  parseSchema,
} from "../../utils/utils.js";
export type findAllQueryConfig = {
  startDocId?: string;
  limit?: number;
  order?: "asc" | "desc";
};

export default class FirebaseCollectionModel<
  CollectionName extends string,
  Schema extends z.ZodObject,
  Outputs extends Partial<DbDocData<Schema>>[] = [DbDocData<Schema>],
> {
  constructor(
    public db: admin.firestore.Firestore,
    public collection: CollectionName,
    public schema: Schema,
  ) {
    if (!collection || collection.trim() === "") {
      throw new Error("Invalid collection name");
    }
  }

  // Helper Methods
  protected ref() {
    return this.db.collection(this.collection);
  }

  protected format(d: DocSnapType): Outputs[number] {
    return {
      id: d.id,
      ...d.data(),
    } as DbDocData<Schema>;
  }

  protected handleFirestoreError(e: unknown): never {
    if (!isFirestoreError(e)) {
      console.log(e);
      throw e;
    }

    switch (e.code) {
      case 6:
      case "already-exists":
        throw new ConflictError(`Document already exists`);

      case 5:
      case "not-found":
        throw new DocumentNotFoundError(`$Document not found`);

      default:
        throw e;
    }
  }

  protected async getDocOrThrow(id: string) {
    const doc = await this.ref().doc(id).get();

    if (!doc.exists) {
      throw new DocumentNotFoundError(`Document with id ${id} does not exist`);
    }
    return doc;
  }

  protected schemaParse(data: unknown) {
    return parseSchema(this.schema, data, this.collection);
  }

  protected schemaPartialParse(data: unknown) {
    return parseObjectPartial(this.schema, data, this.collection);
  }

  /* Sensitive methods interacting directly with database with WRITE access */
  protected async addItem(data: Parsed<Schema, CollectionName>) {
    return await this.ref().add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  protected async updateItem(
    doc: DocSnapType,
    data: ParsedPartial<Schema, CollectionName>,
  ) {
    // console.log(data)
    return await doc.ref.update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Transaction Methods
  protected txAdd(
    tx: admin.firestore.Transaction,
    data: Parsed<Schema, CollectionName>,
  ) {
    const docRef = this.ref().doc();

    tx.create(docRef, {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return docRef;
  }

  protected txUpdate(
    tx: admin.firestore.Transaction,
    doc: DocSnapType,
    data: ParsedPartial<Schema, CollectionName>,
  ) {
    return tx.update(doc.ref, {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  protected txDelete(tx: admin.firestore.Transaction, doc: DocSnapType) {
    return tx.delete(doc.ref);
  }

  /* Basic CRUD methods: Actual Methods */
  async findById(id: string) {
    const doc = await this.getDocOrThrow(id);

    return this.format(doc);
  }

  async findAll(qry: findAllQueryConfig) {
    const { order = "asc", limit = 50, startDocId } = qry;

    let query = this.ref().orderBy("createdAt", order).limit(limit);

    if (startDocId) {
      const startDocSnap = await this.getDocOrThrow(startDocId);
      query = query.startAfter(startDocSnap);
    }

    const snap = await query.get();
    return snap.docs.map((d) => this.format(d));
  }

  async create(data: unknown) {
    const result = this.schemaParse(data);

    const ref = await this.addItem(result.data);

    const doc = await ref.get();
    return this.format(doc);
  }

  async updateById(id: string, data: unknown) {
    const doc = await this.getDocOrThrow(id);

    const parsed = this.schemaPartialParse(data);

    const stripped = stripUndefinedFields(parsed.data);

    if (!Object.keys(stripped).length) {
      throw new BadRequestError("No fields to update");
    }

    await this.updateItem(
      doc,
      stripped as ParsedPartial<Schema, CollectionName>,
    ); // Interesting
    return this.findById(id);
  }

  async deleteById(id: string) {
    const doc = await this.getDocOrThrow(id);

    await doc.ref.delete();

    return { success: true };
  }

  protected async deleteMany(snaps: FirebaseFirestore.QueryDocumentSnapshot[]) {
    const BATCH_SIZE = 500; // Firestore batch limit

    for (let i = 0; i < snaps.length; i += BATCH_SIZE) {
      const batch = this.db.batch();

      for (const snap of snaps.slice(i, i + BATCH_SIZE)) {
        batch.delete(snap.ref);
      }

      await batch.commit();
    }
  }
}
