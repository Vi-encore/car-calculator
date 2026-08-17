import { BadRequestException, Injectable } from '@nestjs/common';
import { MockPricesService } from '../prices/mock-prices.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalculationDto, PriceItem } from '@car-calculator/types';

@Injectable()
export class CalculationsService {
  constructor(
    private readonly pricesService: MockPricesService,
    private readonly prismaService: PrismaService,
  ) {}

  private filterOutliers(cars: PriceItem[]): PriceItem[] {
    if (cars.length < 4) return cars;
    const sorted = [...cars].sort((a, b) => a.price - b.price);
    const q1 = sorted[Math.floor(sorted.length * 0.25)].price;
    const q3 = sorted[Math.floor(sorted.length * 0.75)].price;

    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    return cars.filter(
      (car) => car.price >= lowerBound && car.price <= upperBound,
    );
  }

  async calculateAvgPrice(dto: CreateCalculationDto, userId: string) {
    const cars = await this.pricesService.fetchPrices(dto);
    if (cars.length === 0) throw new BadRequestException('Cars not found');

    const normalizedCars = this.filterOutliers(cars);

    const avgPrice = Math.round(
      normalizedCars.reduce((acc, cur) => {
        return acc + cur.price;
      }, 0) / normalizedCars.length,
    );

    const photoUrl =
      normalizedCars.find((car) => car.photoUrl)?.photoUrl || null;

    const carsWithMileage = normalizedCars.filter((car) => car.mileage);
    let avgMileage = null;

    if (carsWithMileage.length > 0) {
      avgMileage = Math.round(
        carsWithMileage.reduce((acc, cur) => acc + cur.mileage!, 0) /
          carsWithMileage.length,
      );
    }

    const savedCalc = await this.prismaService.calculation.create({
      data: {
        ...dto,
        avgPrice,
        photoUrl,
        avgMileage,
        userId,
      },
    });

    return savedCalc;
  }

  async getHistory(userId: string, pageStr?: string, limitStr?: string) {
    const MAX_LIMIT = 100;
    const DEFAULT_LIMIT = 10;

    const rawLimit = Number.parseInt(limitStr ?? '', 10);
    const rawPage = Number.parseInt(pageStr ?? '', 10);

    // Clamp: default 10, min 1, max 100
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
      : DEFAULT_LIMIT;
    // Clamp: default 1, min 1
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const skip = (page - 1) * limit;

    const data = await this.prismaService.calculation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await this.prismaService.calculation.count({
      where: { userId },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
