import { Brand } from "../models/base/base.types.ts";

declare global {
  namespace Express {
    interface Request {
      identity?: string;
    }
  }
}

export {};
