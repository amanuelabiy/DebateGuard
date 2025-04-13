/*
  Warnings:

  - You are about to drop the column `content` on the `Analysis` table. All the data in the column will be lost.
  - The `participants` column on the `DebateSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `content` on the `Transcript` table. All the data in the column will be lost.
  - Added the required column `fallacies` to the `Analysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `speaker1` to the `Transcript` table without a default value. This is not possible if the table is not empty.
  - Added the required column `speaker2` to the `Transcript` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "content",
ADD COLUMN     "fallacies" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "DebateSession" DROP COLUMN "participants",
ADD COLUMN     "participants" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Transcript" DROP COLUMN "content",
ADD COLUMN     "speaker1" JSONB NOT NULL,
ADD COLUMN     "speaker2" JSONB NOT NULL;
