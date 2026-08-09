import { CreateCalculationDto, PriceItem } from '@car-calculator/types';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MockPricesService {
  private readonly logger = new Logger(MockPricesService.name);

  private readonly mockPhotos = [
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376710356-788647ba308a?q=80&w=500&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=500&auto=format&fit=crop',
  ];

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async fetchPrices(dto: CreateCalculationDto): Promise<PriceItem[]> {
    this.logger.log(
      `Mocking AutoRIA search for ${dto.brand} ${dto.model} (${dto.yearFrom}-${dto.yearTo})`,
    );

    await new Promise((resolve) => setTimeout(resolve, 800));

    const itemsCount = this.getRandomInt(50, 100);
    const results: PriceItem[] = [];

    const basePrice = this.getRandomInt(8000, 25000);

    for (let i = 0; i < itemsCount; i++) {
      const year = this.getRandomInt(dto.yearFrom, dto.yearTo);

      const age = new Date().getFullYear() - year;
      const baseMileage = age * 15000;
      const mileage = baseMileage + this.getRandomInt(-20000, 30000);
      let price = basePrice - age * 500 - mileage / 100;
      price += this.getRandomInt(-2000, 2000);

      const isOutlier = Math.random() < 0.05;
      if (isOutlier) {
        price =
          Math.random() < 0.5
            ? this.getRandomInt(500, 3000)
            : this.getRandomInt(50000, 100000);
      }

      if (price < 1000) price = 1000;

      const photoUrl =
        this.mockPhotos[this.getRandomInt(0, this.mockPhotos.length - 1)];
      results.push({
        price: Math.round(price),
        year,
        mileage: mileage > 0 ? mileage : 5000,
        source: 'AutoRIA_Mock',
        photoUrl,
      });
    }
    this.logger.log(`Found ${results.length} mock cars`);
    return results;
  }
}
