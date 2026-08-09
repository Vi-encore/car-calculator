import { Test, TestingModule } from '@nestjs/testing';
import { CalculationsService } from './calculations.service';

describe('CalculationsService', () => {
  let service: CalculationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalculationsService],
    }).compile();

    service = module.get<CalculationsService>(CalculationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
