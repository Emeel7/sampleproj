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
  UserInputType,
  UserFieldTypes,
  UserQueriableFieldTypes,
  UserUpdatableFieldTypes,
  NewUserDetails,
  UserLoginFieldTypes,
  UserSchemaType,
  DefaultUserOutputType,
  FullUserOutputType,
  IdentifiedUserType,
  UserIdentifiableFieldTypes,
} from "./users.types.js";
import {
  userSchema,
  userFieldSchemas,
  userLookupSchema,
} from "./UserSchemas.js";
import { Note } from "../Note/Note.js";

export class UserModel extends FirebaseCollectionModel<
  "users",
  UserSchemaType,
  [DefaultUserOutputType, FullUserOutputType, IdentifiedUserType]
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

  // ----------- UTILITY FUNCTIONS
  protected override format(d: DocSnapType): DefaultUserOutputType;
  protected override format(
    d: DocSnapType,
    opts: { fullUser: true },
  ): FullUserOutputType;
  protected override format(
    d: DocSnapType,
    opts: { fullIdentity: true },
  ): IdentifiedUserType;
  protected override format(
    d: DocSnapType,
    opts?: { fullUser: true } | { fullIdentity: true },
  ) {
    const userDoc = {
      id: d.id,
      ...d.data(),
    } as FullUserOutputType;

    if (!opts) {
      const { auth, ...userWithoutAuth } = userDoc;
      return userWithoutAuth;
    }

    if ("fullUser" in opts) return userDoc;

    if ("fullIdentity" in opts) {
      const { auth, createdAt, updatedAt, ...normalUser } = userDoc;
      return {
        ...normalUser,
        sessionToken: auth.sessionToken,
      };
    }

    throw new InternalServerError("Invalid options for format");
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

  protected async findUserByQuery(query: FirebaseQueryType) {
    const snap = await query.limit(1).get();

    return snap;
  }

  // -------------- CREATE
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

  // -------------- READ
  override async findAll() {
    //    throw new ForbiddenError();
    const snap = await this.ref().orderBy("createdAt", "asc").get();

    return snap.docs.map((d) => this.format(d));
  }

  override async findById(userId: string): Promise<DefaultUserOutputType>;
  override async findById(
    userId: string,
    opts: { fullUser: true },
  ): Promise<FullUserOutputType>;
  override async findById(
    userId: string,
    opts: { fullIdentity: true },
  ): Promise<IdentifiedUserType>;
  override async findById(
    userId: string,
    opts?: { fullUser: true } | { fullIdentity: true },
  ) {
    const doc = await this.getDocOrThrow(userId);

    if (!opts) {
      return this.format(doc);
    }

    if ("fullUser" in opts) {
      return this.format(doc, { fullUser: true });
    }

    if ("fullIdentity" in opts) {
      return this.format(doc, { fullIdentity: true });
    }

    throw new InternalServerError("Invalid options for findById");
  }

  async getUserByField<TField extends keyof UserQueriableFieldTypes>(
    field: TField,
    value: UserQueriableFieldTypes[TField],
  ): Promise<DefaultUserOutputType>;
  async getUserByField<TField extends keyof UserQueriableFieldTypes>(
    field: TField,
    value: UserQueriableFieldTypes[TField],
    opts: { fullUser: true },
  ): Promise<FullUserOutputType>;
  async getUserByField<TField extends keyof UserQueriableFieldTypes>(
    field: TField,
    value: UserQueriableFieldTypes[TField],
    opts: { dbDoc: true },
  ): Promise<DocSnapType>;
  async getUserByField<TField extends keyof UserQueriableFieldTypes>(
    field: TField,
    value: UserQueriableFieldTypes[TField],
    opts: { fullIdentity: true },
  ): Promise<IdentifiedUserType>;
  async getUserByField<TField extends keyof UserQueriableFieldTypes>(
    field: TField,
    value: UserQueriableFieldTypes[TField],
    opts?: { fullUser: true } | { dbDoc: true } | { fullIdentity: true },
  ) {
    const snap = await this.findUserByQuery(
      this.ref().where(field, "==", value),
    );

    if (snap.empty) {
      if (field === "auth.sessionToken") {
        throw new ForbiddenError();
      }
      throw new DocumentNotFoundError("User Not Found");
    }

    const userDoc = snap.docs[0]!;

    if (!opts) return this.format(userDoc);

    if ("dbDoc" in opts) {
      return snap.docs[0]! as DocSnapType; // Problematic?
    }

    if ("fullIdentity" in opts) {
      return this.format(userDoc, { fullIdentity: true });
    }

    if ("fullUser" in opts) {
      return this.format(userDoc, { fullUser: true });
    }

    return this.format(userDoc);
  }

  // ------------------ UPDATE
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
        let updates: Partial<UserInputType> = {};
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

    await this.authenticateUser(userDoc, oldPass);

    const newSessionToken = this.generateSessionToken();

    this.updateItem(userDoc, {
      auth: {
        password: await this.hashPassword(newPass),
        sessionToken: newSessionToken,
      },
    } as ParsedPartial<UserSchemaType, "users">);

    return { sessionToken: newSessionToken };
  }

  protected async updateNewUserSessionToken(userDoc: DocSnapType) {
    const userData = this.format(userDoc, { fullUser: true });

    const sessionToken = this.generateSessionToken();

    this.updateItem(userDoc, {
      auth: {
        ...userData.auth,
        sessionToken,
      },
    } as ParsedPartial<UserSchemaType, "users">);

    return { sessionToken };
  }

  // ------------ DELETE
  async deleteUser(id: string, password: string): Promise<{ success: true }> {
    // Find user by id
    const userDoc = await this.getDocOrThrow(id);

    // Authenticate delete request
    await this.authenticateUser(userDoc, password);

    // Proceed with deletion
    const userData = this.format(userDoc);

    // Delete all notes associated with the user
    await Note.deleteAllFromUser(userData.id);

    // Finally delete the user and their lookup data in a transaction
    try {
      await this.db.runTransaction(async (tx) => {
        // Delete lookup data
        this.emailLookup.txDeleteDoc(tx, userData.email);
        this.usernameLookup.txDeleteDoc(tx, userData.username);

        console.log("Was deleet!", userData);
        // Delete user details
        this.txDelete(tx, userDoc);
      });
    } catch (e) {
      this.handleFirestoreError(e);
    }
    return { success: true };
  }

  // ------------ AUTH
  protected async authenticateUser(userDoc: DocSnapType, attemptPass: string) {
    const userData = this.format(userDoc, { fullUser: true });

    const match = await this.comparePassword(
      attemptPass,
      userData.auth.password,
    );

    try {
      if (!match) throw new AuthenticationError("Invalid Credentials");
    } catch (e) {
      console.log(e);
      throw e;
    }

    return userData;
  }

  async loginUser<T extends keyof UserLoginFieldTypes>(
    field: T,
    identifier: UserLoginFieldTypes[T],
    password: UserFieldTypes["auth.password"],
  ) {
    // Find user
    const snap = await this.findUserByQuery(
      this.ref().where(field, "==", identifier),
    );

    if (snap.empty) {
      throw new AuthenticationError("Invalid Credentials");
    }

    const userDoc = snap.docs[0]!;

    // Authenticate user
    await this.authenticateUser(userDoc, password);

    // Update session token
    return await this.updateNewUserSessionToken(userDoc);
  }

  async updateUserSessionTokenWithId(userId: string) {
    const userDoc = await this.getDocOrThrow(userId);

    return await this.updateNewUserSessionToken(userDoc);
  }

  async updateUserSessionTokenWithSessionToken(sessionToken: string) {
    const userDoc = await this.getUserByField(
      "auth.sessionToken",
      sessionToken,
      { dbDoc: true },
    );

    return await this.updateNewUserSessionToken(userDoc);
  }

  async logoutUser(sessionToken: string) {
    // Get the user
    const userDoc = await this.getUserByField(
      "auth.sessionToken",
      sessionToken,
      { dbDoc: true },
    );

    // Invalidate existing session token
    await this.updateNewUserSessionToken(userDoc);

    return { success: true };
  }

  // -------------- OVERRIDEN
  override async updateById(id: string, data: unknown): Promise<never> {
    throw new InternalServerError("Unimplimented");
  }

  override async deleteById(id: string): Promise<never> {
    throw new InternalServerError("Unimplimented");
  }

  // ERROR HANDLING
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

export const dbGetUserIdentity = async <
  T extends keyof UserIdentifiableFieldTypes,
>(
  by: T,
  val: UserIdentifiableFieldTypes[T],
): Promise<IdentifiedUserType> => {
  if (by === "id") {
    return await User.findById(val, { fullIdentity: true });
  } else {
    return await User.getUserByField(by, val, { fullIdentity: true });
  }
};

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

export const dbUpdateUserPassword = async (
  userId: string,
  oldPass: string,
  newPass: string,
) => await User.updateUserPassword(userId, oldPass, newPass);

// DELETE
export const dbDeleteUser = async (userId: string, password: string) =>
  await User.deleteUser(userId, password);

// AUTH
export const dbLoginUser = async <T extends keyof UserLoginFieldTypes>(
  by: T,
  identifier: UserLoginFieldTypes[T],
  password: string,
) => await User.loginUser(by, identifier, password);

export const dbRefreshUserSessionToken = async (sessionToken: string) =>
  await User.updateUserSessionTokenWithSessionToken(sessionToken);

export const dbLogoutUser = async (sessionToken: string) =>
  await User.logoutUser(sessionToken);
