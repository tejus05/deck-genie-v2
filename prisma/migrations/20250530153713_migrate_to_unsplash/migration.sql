/*
  Warnings:

  - You are about to drop the column `imageModel` on the `Presentation` table. All the data in the column will be lost.
  - You are about to drop the `GeneratedImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GeneratedImage" DROP CONSTRAINT "GeneratedImage_userId_fkey";

-- AlterTable
ALTER TABLE "Presentation" DROP COLUMN "imageModel";

-- DropTable
DROP TABLE "GeneratedImage";

-- CreateTable
CREATE TABLE "ImageUsage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "unsplashId" TEXT NOT NULL,
    "searchTerm" TEXT NOT NULL,
    "photographer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ImageUsage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ImageUsage" ADD CONSTRAINT "ImageUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
