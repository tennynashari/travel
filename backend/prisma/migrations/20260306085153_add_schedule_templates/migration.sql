-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "schedules" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringDays" JSONB,
ADD COLUMN     "recurringType" "RecurringType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "sourceTemplateId" TEXT,
ADD COLUMN     "templateName" TEXT;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_sourceTemplateId_fkey" FOREIGN KEY ("sourceTemplateId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
