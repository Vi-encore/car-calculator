import { CreateCalculationDto, PriceItem } from '@car-calculator/types';

export abstract class IPricesService {
  abstract fetchPrices(dto: CreateCalculationDto): Promise<PriceItem[]>;
}
