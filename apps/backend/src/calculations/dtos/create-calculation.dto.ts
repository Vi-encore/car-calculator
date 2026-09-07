import { createZodDto } from 'nestjs-zod';
import { CreateCalculationDtoSchema } from '@car-calculator/types';

export class CreateCalculationDto extends createZodDto(
  CreateCalculationDtoSchema,
) {}
