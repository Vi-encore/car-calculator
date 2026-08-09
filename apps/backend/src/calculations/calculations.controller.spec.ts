import { Test, TestingModule } from '@nestjs/testing';
import { CalculationsController } from './calculations.controller';
import { CalculationsService } from './calculations.service';

describe('CalculationsController', () => {
  let controller: CalculationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalculationsController],
      providers: [{ provide: CalculationsService, useValue: {} }],
    }).compile();

    controller = module.get<CalculationsController>(CalculationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
