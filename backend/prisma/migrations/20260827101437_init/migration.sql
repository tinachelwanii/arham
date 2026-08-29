-- CreateEnum
CREATE TYPE "PullStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Trade" (
    "id" SERIAL NOT NULL,
    "tradeId" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullJob" (
    "id" TEXT NOT NULL,
    "status" "PullStatus" NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "recordsFetched" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PullJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trade_tradeId_key" ON "Trade"("tradeId");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE INDEX "Trade_timestamp_idx" ON "Trade"("timestamp");

-- CreateIndex
CREATE INDEX "PullJob_status_idx" ON "PullJob"("status");

-- CreateIndex
CREATE INDEX "PullJob_createdAt_idx" ON "PullJob"("createdAt");
