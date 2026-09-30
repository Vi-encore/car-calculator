import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CalculationsService } from './calculations.service';
import { PricesModule } from '../prices/prices.module';
import { PrismaModule } from '../prisma/prisma.module';

describe('CalculationsService', () => {
  let service: CalculationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // ConfigModule provides ConfigService, which AutoRiaPricesService
      // (registered in PricesModule) depends on.
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        PricesModule,
        PrismaModule,
      ],
      providers: [CalculationsService],
    }).compile();

    service = module.get<CalculationsService>(CalculationsService);
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
        { price: 10, year: 2020, mileage: 0, photoUrl: '' }, // Anomaly (low)
        { price: 30, year: 2020, mileage: 0, photoUrl: '' },
        { price: 31, year: 2020, mileage: 0, photoUrl: '' },
        { price: 32, year: 2020, mileage: 0, photoUrl: '' },
        { price: 33, year: 2020, mileage: 0, photoUrl: '' },
        { price: 34, year: 2020, mileage: 0, photoUrl: '' },
        { price: 35, year: 2020, mileage: 0, photoUrl: '' },
        { price: 100, year: 2020, mileage: 0, photoUrl: '' }, // Anomaly (high)
      ];

      const filtered = service['filterOutliers'](mockCars);
      expect(filtered.length).toBe(6);
      expect(filtered.find((c) => c.price === 10)).toBeUndefined();
      expect(filtered.find((c) => c.price === 100)).toBeUndefined();
    });
  });
});
