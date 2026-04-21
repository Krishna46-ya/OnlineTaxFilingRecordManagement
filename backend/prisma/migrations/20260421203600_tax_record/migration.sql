-- CreateTable
CREATE TABLE "TaxRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "salaryIncome" DOUBLE PRECISION NOT NULL,
    "businessIncome" DOUBLE PRECISION NOT NULL,
    "capitalGains" DOUBLE PRECISION NOT NULL,
    "otherIncome" DOUBLE PRECISION NOT NULL,
    "totalIncome" DOUBLE PRECISION NOT NULL,
    "section80C" DOUBLE PRECISION NOT NULL,
    "section80D" DOUBLE PRECISION NOT NULL,
    "section80E" DOUBLE PRECISION NOT NULL,
    "otherDeductions" DOUBLE PRECISION NOT NULL,
    "totalDeductions" DOUBLE PRECISION NOT NULL,
    "taxableIncome" DOUBLE PRECISION NOT NULL,
    "taxCalculated" DOUBLE PRECISION NOT NULL,
    "taxPaid" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaxRecord" ADD CONSTRAINT "TaxRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
