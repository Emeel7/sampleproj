import type { IdentifiedUserType } from "../models/User/users.types.js";

declare global {
  namespace Express {
    interface Request {
      identity?: IdentifiedUserType;
    }
  }
}

export {};
