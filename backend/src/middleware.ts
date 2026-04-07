import type { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
import type { authRequest } from "./lib/types.js";

export function authMiddleware(req: authRequest, res: Response, next: NextFunction) {
    const token = req.cookies.token;
    console.log("krishna  " + token)

    if (!token) {
        return res.status(401).send({
            msg: "user not logged in"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)
        if (typeof decoded === "string") {
            return res.status(400).send({ msg: "invalid token" });
        }

        req.user = {
            userId: decoded.userId,
            email: decoded.email
        }
        next();

    } catch (err) {
        return res.status(401).send({
            msg: "invalid token login again"
        })
    }
}