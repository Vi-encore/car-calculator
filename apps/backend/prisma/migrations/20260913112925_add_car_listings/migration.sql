-- CreateTable
CREATE TABLE "car_listings" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER,
    "source" TEXT,
    "photoUrl" TEXT,

    CONSTRAINT "car_listings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "car_listings" ADD CONSTRAINT "car_listings_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "calculations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
