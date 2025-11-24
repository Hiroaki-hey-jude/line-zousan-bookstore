/*
  Warnings:

  - Added the required column `phone` to the `UserAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientName` to the `UserAddress` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserAddress" ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "recipientName" TEXT NOT NULL;
