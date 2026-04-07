import type { Request } from "express";

export interface authRequest extends Request {
    user?: {
        userId: string,
        email: string
    }
}