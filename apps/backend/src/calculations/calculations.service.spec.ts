import { Test, TestingModule } from '@nestjs/testing';
import { CalculationsService } from './calculations.service';
import { PricesModule } from '../prices/prices.module';
import { PrismaModule } from '../prisma/prisma.module';
import { IPricesService } from '../prices/prices.interface';

describe('CalculationsService', () => {
  let service: CalculationsService;
  let mockPricesService: IPricesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PricesModule, PrismaModule],
      providers: [CalculationsService],
    }).compile();

    service = module.get<CalculationsService>(CalculationsService);
    mockPricesService = module.get<IPricesService>(IPricesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('IQR Algorithm (filterOutliers)', () => {
    it('should not filter if less than 4 cars', () => {
      const mockCars = [
        { price: 10, year: 2020, mileage: 0, photoUrl: '' },
        { price: 100, year: 2020, mileage: 0, photoUrl: '' },
      ];
      const filtered = service['filterOutliers'](mockCars);
      expect(filtered.length).toBe(2);
    });

    it('should correctly filter out extreme low and high anomalies', () => {
      const mockCars = [
        { price: 10, year: 2020, mileage: 0, photoUrl: '' },   // Anomaly (low)
        { price: 30, year: 2020, mileage: 0, photoUrl: '' },
        { price: 31, year: 2020, mileage: 0, photoUrl: '' },
        { price: 32, year: 2020, mileage: 0, photoUrl: '' },
        { price: 33, year: 2020, mileage: 0, photoUrl: '' },
        { price: 34, year: 2020, mileage: 0, photoUrl: '' },
        { price: 35, year: 2020, mileage: 0, photoUrl: '' },
        { price: 100, year: 2020, mileage: 0, photoUrl: '' },  // Anomaly (high)
      ];

      const filtered = service['filterOutliers'](mockCars);
      expect(filtered.length).toBe(6);
      expect(filtered.find(c => c.price === 10)).toBeUndefined();
      expect(filtered.find(c => c.price === 100)).toBeUndefined();
    });
  });
});
