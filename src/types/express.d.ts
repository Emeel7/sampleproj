import type { FullUserOutputType } from "../models/User/users.types.js";

declare global {
  namespace Express {
    interface Request {
      identity?: FullUserOutputType;
    }
  }
}

export {};
