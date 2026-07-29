import admin from "firebase-admin";
import { ConflictError, DocumentNotFoundError } from "../errors/Errors.js";

import { z } from "zod";
import type {
  DbDocData,
  DbDocType,
  DocSnapType,
  Infer,
  Parsed,
  ParsedPartial,
} from "./base.types.js";
import { parseSchema, parseObjectPartial } from "../../utils/utils.js";

export default class FirebaseLookupModel<
  T extends z.ZodObject,
  B extends string,
> {
  constructor(
    public db: admin.firestore.Firestore,
    public documentName: B,
    public schema: T,
  ) {
    if (!documentName || documentName.trim() === "") {
      throw new Error("Invalid document name");
    }
  }

  // Helper Properties
  protected getDocRef(docName: string) {
    return this.db.doc(`${this.documentName}/${docName}`);
  }

  protected async getDocOrThrow(docName: string) {
    const d = await this.getDocRef(docName).get();

    if (!d.exists) {
      throw new DocumentNotFoundError(
        `Document with lookup ${docName} does not exist`,
      );
    }
    return d;
  }

  protected format(d: DocSnapType) {
    if (!d.exists) {
      throw new DocumentNotFoundError(
        `Document with id ${d.id} somehow does not exist`,
      );
    }

    return { id: d.id, ...(d.data() as DbDocData<T>) };
  }

  protected schemaParse(data: unknown) {
    return parseSchema(this.schema, data, this.documentName);
  }

  protected schemaPartialParse(data: unknown) {
    return parseObjectPartial(this.schema, data, this.documentName);
  }

  /* Sensitive methods interacting directly with database with WRITE access */
  protected addItem(
    tx: admin.firestore.Transaction,
    docName: string,
    data: Parsed<T, B>,
  ) {
    return tx.create(this.getDocRef(docName), {
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  protected updateItem(
    tx: admin.firestore.Transaction,
    docName: string,
    data: ParsedPartial<T, B>,
  ) {
    return tx.update(this.getDocRef(docName), {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /* ACTUAL METHODS (Mostly Transactional) */
  txCreateNewDoc(
    tx: admin.firestore.Transaction,
    docName: string,
    data: unknown,
  ) {
    const result = this.schemaParse(data);

    return this.addItem(tx, docName, result.data);
  }

  async getDoc(docName: string) {
    const foundDoc = await this.getDocOrThrow(docName);

    return this.format(foundDoc);
  }

  async txUpdateDoc(
    tx: admin.firestore.Transaction,
    docName: string,
    data: unknown,
  ) {
    const result = this.schemaPartialParse(data);

    return this.updateItem(tx, docName, result.data);
  }

  txDeleteDoc(tx: admin.firestore.Transaction, docName: string) {
    return tx.delete(this.getDocRef(docName));
  }

  async transferLookupData(
    tx: admin.firestore.Transaction,
    prevDocName: string,
    newDocName: string,
    data: Infer<T>,
  ) {
    if (prevDocName === newDocName) return;

    const result = this.schemaParse(data);

    this.addItem(tx, newDocName, result.data);
    this.txDeleteDoc(tx, prevDocName);
  }
}
