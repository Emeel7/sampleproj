import bcrypt from "bcrypt";
import crypto from "crypto";
import { connectDB } from "../../resources/database.js";
import FirebaseLookupModel from "../Base/LookupModel.js";
import FirebaseCollectionModel from "../Base/CollectionModel.js";
import { isFirestoreError, parseSchema } from "../../utils/utils.js";
import {
  AuthenticationError,
  ConflictError,
  DocumentNotFoundError,
  ForbiddenError,
  InternalServerError,
} from "../errors/Errors.js";
import type {
  DbDocData,
  DocSnapType,
  FirebaseQueryType,
  ParsedPartial,
} from "../Base/base.types.js";
import type {
  UserType,
  UserFieldTypes,
  UserQueriableFieldTypes,
  UserUpdatableFieldTypes,
  NewUserDetails,
  UserLoginFieldTypes,
  UserSchemaType,
  DefaultUserOutputType,
  FullUserOutputType,
} from "./users.types.js";
import {
  userSchema,
  userFieldSchemas,
  userLookupSchema,
} from "./UserSchemas.js";

export class UserModel extends FirebaseCollectionModel<
  "users",
  UserSchemaType,
  [DefaultUserOutputType, FullUserOutputType]
> {
  private usernameLookup = new FirebaseLookupModel(
    connectDB(),
    "username",
    userLookupSchema,
  );
  private emailLookup = new FirebaseLookupModel(
    connectDB(),
    "email",
    userLookupSchema,
  );

  constructor() {
    super(connectDB(), "users", userSchema);
  }

  // Helpful
  protected override format(d: DocSnapType): DefaultUserOutputType;
  protected override format(
    d: DocSnapType,
    opts: { keepAuth: true },
  ): FullUserOutputType;
  protected override format(d: DocSnapType, opts?: { keepAuth: true }) {
    const userDoc = {
      id: d.id,
      ...d.data(),
    } as FullUserOutputType;

    if (!opts?.keepAuth) {
      const { auth, ...userWithoutAuth } = userDoc;
      return userWithoutAuth;
    }

    return userDoc;
  }

  protected async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }

  protected async comparePassword(trial: string, actualHash: string) {
    return await bcrypt.compare(trial, actualHash);
  }

  protected generateSessionToken(): string {
    return crypto.randomBytes(32).toString("base64url");
  }

  protected async findUser(query: FirebaseQueryType) {
    const snap = await query.limit(1).get();

    return snap;
  }

  protected async authenticateUser(userDoc: DocSnapType, attemptPass: string) {
    const userData = this.format(userDoc, { keepAuth: true });

    const match = await this.comparePassword(
      attemptPass,
      userData.auth.password,
    );

    if (!match) throw new AuthenticationError("Invalid Credentials");

    return userData;
  }

  // Actual
  async createNewUser(config: NewUserDetails) {
    const { username, email, password } = config;

    const auth = {
      password: await this.hashPassword(password),
      sessionToken: this.generateSessionToken(),
    };

    const result = this.schemaParse({
      username,
      email,
      auth,
    });

    const parsed = result.data;

    try {
      return await this.db.runTransaction(async (tx) => {
        const newUser = this.txAdd(tx, parsed);
        const lookup = {
          userId: newUser.id,
        };

        console.log(lookup);
        this.usernameLookup.txCreateNewDoc(tx, parsed.username, lookup);
        this.emailLookup.txCreateNewDoc(tx, parsed.email, lookup);

        return {
          username,
          email,
          userId: newUser.id,
          sessionToken: auth.sessionToken,
        };
      });
    } catch (e) {
      this.handleFirestoreError(e);
    }
  }

  async getUserByField<TField extends keyof UserQueriableFieldTypes>(
    field: TField,
    value: UserQueriableFieldTypes[TField],
  ): Promise<DefaultUserOutputType>;
  async getUserByField<TField extends keyof UserQueriableFieldTypes>(
    field: TField,
    value: UserQueriableFieldTypes[TField],
    opts: { keepAuth?: true },
  ): Promise<FullUserOutputType>;
  async getUserByField<TField extends keyof UserQueriableFieldTypes>(
    field: TField,
    value: UserQueriableFieldTypes[TField],
    opts: { dbDoc?: true },
  ): Promise<DocSnapType>;
  async getUserByField<TField extends keyof UserQueriableFieldTypes>(
    field: TField,
    value: UserQueriableFieldTypes[TField],
    opts?: { keepAuth?: true; dbDoc?: true },
  ) {
    const snap = await this.findUser(this.ref().where(field, "==", value));

    if (snap.empty) {
      if (field === "auth.sessionToken") {
        throw new ForbiddenError();
      }
      throw new DocumentNotFoundError("User Not Found");
    }

    if (opts?.dbDoc) {
      return snap.docs[0]! as DocSnapType; // Problematic?
    }

    const userDoc = snap.docs[0]!;
    const checking = userDoc.data();

    if (opts?.keepAuth) {
      return this.format(userDoc, { keepAuth: true });
    }

    return this.format(userDoc);
  }

  async updateUserField<T extends keyof UserUpdatableFieldTypes>(
    userId: string,
    field: T,
    value: UserUpdatableFieldTypes[T],
  ) {
    const userDoc = await this.getDocOrThrow(userId);
    const { username, email } = this.format(userDoc);

    parseSchema(userFieldSchemas[field], value, field);

    try {
      await this.db.runTransaction(async (tx) => {
        let updates: Partial<UserType> = {};
        switch (field) {
          case "username":
            await this.usernameLookup.transferLookupData(tx, username, value, {
              userId,
            });

            updates.username = value;
            break;

          case "email":
            await this.emailLookup.transferLookupData(tx, email, value, {
              userId,
            });

            updates.email = value;
            break;
        }

        const result = this.schemaPartialParse(updates);

        this.txUpdate(tx, userDoc, result.data);
      });
    } catch (e) {
      this.handleFirestoreError(e);
    }
  }

  async updateUserPassword(
    userId: string,
    oldPass: UserFieldTypes["auth.password"],
    newPass: UserFieldTypes["auth.password"],
  ) {
    const userDoc = await this.getDocOrThrow(userId);

    this.authenticateUser(userDoc, oldPass);

    const newSessionToken = this.generateSessionToken();

    this.updateItem(userDoc, {
      auth: {
        password: await this.hashPassword(newPass),
        sessionToken: newSessionToken,
      },
    } as ParsedPartial<UserSchemaType, "users">);

    return { sessionToken: newSessionToken };
  }

  protected async updateUserSessionToken(userDoc: DocSnapType) {
    const userData = this.format(userDoc, { keepAuth: true });

    const sessionToken = this.generateSessionToken();

    this.updateItem(userDoc, {
      auth: {
        ...userData.auth,
        sessionToken,
      },
    } as ParsedPartial<UserSchemaType, "users">);

    return { sessionToken };
  }

  async updateUserSessionTokenWithId(userId: string) {
    const userDoc = await this.getDocOrThrow(userId);

    return await this.updateUserSessionToken(userDoc);
  }

  async updateUserSessionTokenWithSessionToken(sessionToken: string) {
    const userDoc = await this.getUserByField(
      "auth.sessionToken",
      sessionToken,
      { dbDoc: true },
    );

    return await this.updateUserSessionToken(userDoc);
  }

  async loginUser<T extends keyof UserLoginFieldTypes>(
    field: T,
    identifier: UserLoginFieldTypes[T],
    password: UserFieldTypes["auth.password"],
  ) {
    // Find user
    const snap = await this.findUser(this.ref().where(field, "==", identifier));

    if (snap.empty) {
      throw new AuthenticationError("Invalid Credentials");
    }

    const userDoc = snap.docs[0]!;

    // Authenticate user
    await this.authenticateUser(userDoc, password);

    // Update session token
    return await this.updateUserSessionToken(userDoc);
  }

  override async findById(userId: string) {
    const doc = await this.getDocOrThrow(userId);

    return this.format(doc);
  }

  override async updateById(id: string, data: unknown): Promise<never> {
    throw new InternalServerError("Unimplimented");
  }

  override async deleteById(id: string) {
    const userDoc = await this.getDocOrThrow(id);

    const userData = this.format(userDoc);

    try {
      this.db.runTransaction(async (tx) => {
        this.emailLookup.txDeleteDoc(tx, userData.id);
        this.usernameLookup.txDeleteDoc(tx, userData.id);
        this.txDelete(tx, userDoc);
      });
    } catch (e) {
      this.handleFirestoreError(e);
    }
    return { success: true };
  }

  override async findAll() {
    const snap = await this.ref().orderBy("createdAt", "asc").get();

    return snap.docs.map((d) => this.format(d));
  }

  protected override handleFirestoreError(e: unknown): never {
    if (!isFirestoreError(e)) {
      console.log(e);
      throw e;
    }

    switch (e.code) {
      case 6:
      case "already-exists":
        const conflict = e.details?.includes(`documents/username/`)
          ? "Username taken"
          : "Email already in use";

        throw new ConflictError(conflict);

      case 5:
      case "not-found":
        throw new DocumentNotFoundError(`$Document not found`);

      default:
        throw e;
    }
  }
}

export const User = new UserModel();

// CREATE
export const dbCreateNewUser = async (conf: NewUserDetails) =>
  await User.createNewUser(conf);

// GET
export const dbGetAllUsers = async () => await User.findAll();

export const dbGetUserByField = async <T extends keyof UserQueriableFieldTypes>(
  by: T,
  val: UserQueriableFieldTypes[T],
) => await User.getUserByField(by, val);

export const dbGetUserById = async (userId: string) =>
  await User.findById(userId);

// UPDATE
export const dbUpdateUserByField = async <
  T extends keyof UserUpdatableFieldTypes,
>(
  by: T,
  val: UserUpdatableFieldTypes[T],
  userId: string,
) => await User.updateUserField(userId, by, val);

export const dbUpdateUserSessionToken = async (sessionToken: string) =>
  await User.updateUserSessionTokenWithSessionToken(sessionToken);

export const dbUpdateUserPassword = async (
  userId: string,
  oldPass: string,
  newPass: string,
) => await User.updateUserPassword(userId, oldPass, newPass);

// DELETE
export const dbDeleteUser = async (userId: string) =>
  await User.deleteById(userId);

// AUTH
export const dbLoginUser = async <T extends keyof UserLoginFieldTypes>(
  by: T,
  identifier: UserLoginFieldTypes[T],
  password: string,
) => await User.loginUser(by, identifier, password);
