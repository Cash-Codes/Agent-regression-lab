-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "passedAssertions" INTEGER,
ADD COLUMN     "regressedAssertionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "regression" BOOLEAN DEFAULT false,
ADD COLUMN     "totalAssertions" INTEGER;
