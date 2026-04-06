import express from 'express';
import { prisma } from './lib/prisma.js';
import z from 'zod';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cookieParser from "cookie-parser";

const app = express()
app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res) => {
    res.send({
        msg: "healthy"
    });
})

export const UserSchema = z.object({
    name: z.string()
        .min(3, "Name must be at least 3 characters")
        .max(50)
        .regex(/^[a-zA-Z\s]+$/, "Name should contain only letters"),

    panId: z.string()
        .length(10, "PAN must be 10 characters")
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),

    email: z.email("Invalid email format"),

    DOB: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "DOB must be YYYY-MM-DD"),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must include uppercase letter")
        .regex(/[a-z]/, "Must include lowercase letter")
        .regex(/[0-9]/, "Must include a number")
        .regex(/[^A-Za-z0-9]/, "Must include a special character")
});

app.post('/signup', async (req, res) => {
    const user = UserSchema.safeParse(req.body)

    if (!user.success) {
        return res.status(400).json({
            errors: user.error.issues
        });
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: user.data.email },
                { panId: user.data.panId.toUpperCase() }
            ]
        }
    })

    if (existingUser) {
        return res.send({ msg: "user with pan or email already exist login instead" })
    }

    const passwordHash = await bcrypt.hash(user.data.password, 10);
    await prisma.user.create({
        data: {
            name: user.data.name,
            panId: user.data.panId.toUpperCase(),
            email: user.data.email,
            DOB: new Date(user.data.DOB),
            passwordHash
        }
    })

    return res.send({ msg: "user created successfully" })

})

const loginUserSchema = z.object({
    panId: z.string()
        .length(10, "PAN must be 10 characters")
        .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),

    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Must include uppercase letter")
        .regex(/[a-z]/, "Must include lowercase letter")
        .regex(/[0-9]/, "Must include a number")
        .regex(/[^A-Za-z0-9]/, "Must include a special character")

})

app.post("/signin", async (req, res) => {
    const user = loginUserSchema.safeParse(req.body)
    if (!user.success) {
        return res.status(400).json({
            errors: user.error.issues
        });
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            panId: user.data.panId.toUpperCase()
        }
    })

    if (!existingUser) {
        return res.status(400).send({
            msg: "account with panId doesnt exist"
        })
    }

    const verify = await bcrypt.compare(user.data.password, existingUser.passwordHash)
    if (!verify) {
        return res.status(400).send({
            msg: "incorrect passoword"
        })
    }

    const token = jwt.sign({
        userId: existingUser.id,
        email: existingUser.email
    }, process.env.JWT_SECRET!, { expiresIn: "30m" })

    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 60 * 1000
    })

    return res.send({
        msg: "login successful"
    })
})

app.listen(3000);