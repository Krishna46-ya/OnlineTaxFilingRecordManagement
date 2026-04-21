import express from 'express';
import { prisma } from './lib/prisma.js';
import z from 'zod';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import cookieParser from "cookie-parser";
import { authMiddleware } from './middleware.js';
import cors from "cors"
import { type Response, Router } from "express";
import { type authRequest } from './lib/types.js';


const app = express()
app.use(cors({
    origin: "http://localhost:5173", // your frontend URL
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use("/api", authMiddleware)

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

app.post('/auth/signup', async (req, res) => {
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

app.post("/auth/signin", async (req, res) => {
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

const router = Router();

const taxFilingSchema = z.object({
    financialYear: z
        .string()
        .regex(/^\d{4}-\d{4}$/, "Financial year must be in format YYYY-YYYY (e.g. 2023-2024)"),

    salaryIncome: z.coerce.number().min(0, "Salary income cannot be negative"),
    businessIncome: z.coerce.number().min(0, "Business income cannot be negative"),
    capitalGains: z.coerce.number().min(0, "Capital gains cannot be negative"),
    otherIncome: z.coerce.number().min(0, "Other income cannot be negative"),

    section80C: z.number().min(0).max(150_000, "Section 80C cannot exceed ₹1,50,000"),
    section80D: z.number().min(0).max(100_000, "Section 80D cannot exceed ₹1,00,000"),
    section80E: z.number().min(0, "Section 80E cannot be negative"),
    otherDeductions: z.number().min(0, "Other deductions cannot be negative"),

    taxPaid: z.number().min(0, "Tax paid cannot be negative"),
});

type TaxFilingInput = z.infer<typeof taxFilingSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Tax engine — Indian Old Regime (FY 2023-24)
//
//  Slabs:
//   0  – 2,50,000  →  0 %
//   2,50,001  – 5,00,000  →  5 %
//   5,00,001  – 10,00,000 → 20 %
//   10,00,001 and above   → 30 %
//
//  Standard deduction (Sec 16-ia): ₹50,000 on salary income
//  80C cap  : ₹1,50,000
//  80D cap  : ₹25,000 (₹50,000 for senior citizens — not implemented here)
//  Rebate u/s 87A : if taxable income ≤ ₹5,00,000 → rebate = min(tax, ₹12,500)
//  Surcharge       : 10 % (>50 L) / 15 % (>1 Cr) / 25 % (>2 Cr) / 37 % (>5 Cr)
//  Health & Education Cess: 4 % on (tax + surcharge)
// ─────────────────────────────────────────────────────────────────────────────

const STANDARD_DEDUCTION = 50_000;
const MAX_80C = 150_000;
const MAX_80D_GENERAL = 25_000;

function r2(n: number): number {
    return Math.round(n * 100) / 100;
}

function slabTax(taxableIncome: number): number {
    if (taxableIncome <= 250_000) return 0;
    if (taxableIncome <= 500_000) return (taxableIncome - 250_000) * 0.05;
    if (taxableIncome <= 1_000_000) return 12_500 + (taxableIncome - 500_000) * 0.20;
    return 112_500 + (taxableIncome - 1_000_000) * 0.30;
}

function rebate87A(taxableIncome: number, tax: number): number {
    // Full rebate if taxable income ≤ ₹5 L (max rebate ₹12,500)
    if (taxableIncome <= 500_000) return Math.max(0, tax - Math.min(tax, 12_500));
    return tax;
}

function surcharge(grossIncome: number, taxAfterRebate: number): number {
    if (grossIncome > 50_000_000) return taxAfterRebate * 0.37;
    if (grossIncome > 20_000_000) return taxAfterRebate * 0.25;
    if (grossIncome > 10_000_000) return taxAfterRebate * 0.15;
    if (grossIncome > 5_000_000) return taxAfterRebate * 0.10;
    return 0;
}

interface TaxBreakdown {
    standardDeductionApplied: number;
    section80CApplied: number;
    section80DApplied: number;
    section80EApplied: number;
    otherDeductionsApplied: number;
    totalIncome: number;
    totalDeductions: number;
    taxableIncome: number;
    baseTax: number;
    rebate87A: number;
    surcharge: number;
    cess: number;
    taxCalculated: number;
}

function computeTax(input: TaxFilingInput): TaxBreakdown {
    // ── Income ──
    const totalIncome = r2(
        input.salaryIncome + input.businessIncome + input.capitalGains + input.otherIncome
    );

    // ── Deductions ──
    const stdDed = input.salaryIncome > 0 ? STANDARD_DEDUCTION : 0;
    const ded80C = Math.min(input.section80C, MAX_80C);
    const ded80D = Math.min(input.section80D, MAX_80D_GENERAL);
    const ded80E = input.section80E;
    const dedOther = input.otherDeductions;

    const totalDeductions = r2(stdDed + ded80C + ded80D + ded80E + dedOther);
    const taxableIncome = r2(Math.max(0, totalIncome - totalDeductions));

    // ── Tax ──
    const base = slabTax(taxableIncome);
    const afterRebate = rebate87A(taxableIncome, base);
    const sur = r2(surcharge(totalIncome, afterRebate));
    const cess = r2((afterRebate + sur) * 0.04);
    const taxCalculated = r2(afterRebate + sur + cess);
    const rebateAmt = r2(base - afterRebate);

    return {
        standardDeductionApplied: stdDed,
        section80CApplied: ded80C,
        section80DApplied: ded80D,
        section80EApplied: ded80E,
        otherDeductionsApplied: dedOther,
        totalIncome,
        totalDeductions,
        taxableIncome,
        baseTax: r2(base),
        rebate87A: rebateAmt,
        surcharge: sur,
        cess,
        taxCalculated,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route  POST /tax/file
// ─────────────────────────────────────────────────────────────────────────────
router.post("/file", authMiddleware, async (req: authRequest, res: Response) => {

    // 1 ── Zod validation ──────────────────────────────────────────────────────
    const parsed = taxFilingSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ errors: parsed.error.issues });
    }

    const data = parsed.data;
    const userId = req.user!.userId;

    // 2 ── Financial year sanity ───────────────────────────────────────────────
    const parts = data.financialYear.split("-");


    if (parts.length !== 2) {
        return res.status(400).json({
            msg: "Invalid financial year format. Use YYYY-YYYY (e.g. 2023-2024)",
        });
    }

    const fromYear = Number(parts[0]);
    const toYear = Number(parts[1]);

    if (isNaN(fromYear) || isNaN(toYear)) {
        return res.status(400).json({
            msg: "Financial year must contain valid numbers (e.g. 2023-2024)",
        });
    }

    if (toYear - fromYear !== 1) {
        return res.status(400).json({
            msg: "Financial year must span exactly one year (e.g. 2023-2024)",
        });
    }

    const currentYear = new Date().getFullYear();
    if (fromYear > currentYear) {
        return res.status(400).json({
            msg: `Cannot file for a future financial year. Current year is ${currentYear}`,
        });
    }

    try {
        // 3 ── Verify user exists ──────────────────────────────────────────────
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ msg: "User account not found" });
        }

        // 4 ── Duplicate filing check ──────────────────────────────────────────
        const existing = await prisma.taxRecord.findFirst({
            where: { userId, financialYear: data.financialYear },
        });
        if (existing) {
            return res.status(409).json({
                msg: `A tax return for FY ${data.financialYear} has already been filed`,
                existingRecordId: existing.id,
                filedAt: existing.createdAt,
            });
        }

        // 5 ── Compute tax ─────────────────────────────────────────────────────
        const calc = computeTax(data);

        // 6 ── Persist to DB ───────────────────────────────────────────────────
        const record = await prisma.taxRecord.create({
            data: {
                userId,
                financialYear: data.financialYear,
                salaryIncome: data.salaryIncome,
                businessIncome: data.businessIncome,
                capitalGains: data.capitalGains,
                otherIncome: data.otherIncome,
                totalIncome: calc.totalIncome,

                section80C: calc.section80CApplied,
                section80D: calc.section80DApplied,
                section80E: calc.section80EApplied,
                otherDeductions: calc.otherDeductionsApplied,
                totalDeductions: calc.totalDeductions,

                taxableIncome: calc.taxableIncome,
                taxCalculated: calc.taxCalculated,
                taxPaid: data.taxPaid,

                status: "VALID",
            },
        });

        // 7 ── Build tax balance summary ───────────────────────────────────────
        const balance = r2(calc.taxCalculated - data.taxPaid);
        const isRefund = balance < 0;
        const isDue = balance > 0;
        const absBalance = Math.abs(balance);

        const taxStatus = isRefund
            ? { code: "REFUND", msg: `Eligible for a refund of ₹${absBalance.toLocaleString("en-IN")}` }
            : isDue
                ? { code: "DUE", msg: `Tax due of ₹${absBalance.toLocaleString("en-IN")} must be paid` }
                : { code: "SETTLED", msg: "Tax fully paid — no amount due or refundable" };

        // 8 ── Response ────────────────────────────────────────────────────────
        return res.status(201).json({
            msg: "Income Tax Return filed successfully",

            record: {
                id: record.id,
                financialYear: record.financialYear,
                status: record.status,
                filedAt: record.createdAt,
            },

            summary: {
                taxpayer: {
                    name: user.name,
                    panId: user.panId,
                    email: user.email,
                },

                income: {
                    salaryIncome: data.salaryIncome,
                    businessIncome: data.businessIncome,
                    capitalGains: data.capitalGains,
                    otherIncome: data.otherIncome,
                    totalIncome: calc.totalIncome,
                },

                deductions: {
                    standardDeduction: calc.standardDeductionApplied,  // Sec 16(ia)
                    section80C: calc.section80CApplied,
                    section80D: calc.section80DApplied,
                    section80E: calc.section80EApplied,
                    otherDeductions: calc.otherDeductionsApplied,
                    totalDeductions: calc.totalDeductions,

                    // Warn if user claimed more than the statutory cap
                    capped: {
                        section80C: data.section80C > MAX_80C,
                        section80D: data.section80D > MAX_80D_GENERAL,
                    },
                },

                tax: {
                    taxableIncome: calc.taxableIncome,
                    baseTax: calc.baseTax,
                    rebateU87A: calc.rebate87A,
                    surcharge: calc.surcharge,
                    cess: calc.cess,               // 4 % health & education cess
                    taxCalculated: calc.taxCalculated,
                    taxPaid: data.taxPaid,
                    balance,                                  // negative = refund, positive = due
                    taxStatus,
                },

                regime: "OLD_REGIME",
                note: "Tax computed under the Old Tax Regime for FY " + data.financialYear,
            },
        });

    } catch (err) {
        console.error("[tax/file] error:", err);
        return res.status(500).json({ msg: "Internal server error. Please try again later." });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Route  GET /tax/records   — list all filings for the logged-in user
// ─────────────────────────────────────────────────────────────────────────────
router.get("/records", authMiddleware, async (req: authRequest, res: Response) => {
    try {
        const records = await prisma.taxRecord.findMany({
            where: { userId: req.user!.userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                financialYear: true,
                totalIncome: true,
                taxableIncome: true,
                taxCalculated: true,
                taxPaid: true,
                status: true,
                createdAt: true,
            },
        });

        return res.json({
            count: records.length,
            records: records.map(r => ({
                ...r,
                balance: r2(r.taxCalculated - r.taxPaid),
                taxStatus: r.taxCalculated - r.taxPaid < 0
                    ? "REFUND"
                    : r.taxCalculated - r.taxPaid > 0
                        ? "DUE"
                        : "SETTLED",
            })),
        });
    } catch (err) {
        console.error("[tax/records] error:", err);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Route  GET /tax/records/:id   — single record detail
// ─────────────────────────────────────────────────────────────────────────────
router.get("/records/:id", authMiddleware, async (req: authRequest, res: Response) => {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
        return res.status(400).json({
            msg: "Record ID is required and must be a string",
        });
    }

    try {
        const record = await prisma.taxRecord.findFirst({
            where: { id, userId: req.user!.userId },   // userId guard prevents cross-user access
        });

        if (!record) {
            return res.status(404).json({ msg: "Tax record not found" });
        }

        const balance = r2(record.taxCalculated - record.taxPaid);

        return res.json({
            record,
            balance,
            taxStatus:
                balance < 0 ? "REFUND" :
                    balance > 0 ? "DUE" : "SETTLED",
        });
    } catch (err) {
        console.error("[tax/records/:id] error:", err);
        return res.status(500).json({ msg: "Internal server error" });
    }
});

app.listen(3000);