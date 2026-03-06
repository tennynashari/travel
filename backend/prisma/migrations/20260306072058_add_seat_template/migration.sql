-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "seatTemplateId" TEXT;

-- CreateTable
CREATE TABLE "seat_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rowsConfig" JSONB NOT NULL,
    "totalSeats" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seat_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seat_templates_name_key" ON "seat_templates"("name");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_seatTemplateId_fkey" FOREIGN KEY ("seatTemplateId") REFERENCES "seat_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
