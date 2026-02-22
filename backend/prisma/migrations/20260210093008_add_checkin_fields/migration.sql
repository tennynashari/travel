-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "checkInBy" TEXT,
ADD COLUMN     "checkInTime" TIMESTAMP(3),
ADD COLUMN     "checkedIn" BOOLEAN NOT NULL DEFAULT false;
