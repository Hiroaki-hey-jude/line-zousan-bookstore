/*
  Warnings:

  - You are about to drop the column `stock` on the `Book` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "stock",
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "inStock" BOOLEAN NOT NULL DEFAULT true;
