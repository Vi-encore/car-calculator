import { Test, TestingModule } from '@nestjs/testing';
import { CalculationsController } from './calculations.controller';

describe('CalculationsController', () => {
  let controller: CalculationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalculationsController],
    }).compile();

    controller = module.get<CalculationsController>(CalculationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
