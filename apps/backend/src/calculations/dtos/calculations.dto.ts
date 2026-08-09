import {
  CalculationSchema,
  CreateCalculationDtoSchema,
} from '@car-calculator/types';
import { createZodDto } from 'nestjs-zod';

export class CreateCalculationDto extends createZodDto(
  CreateCalculationDtoSchema,
) {}

export class CalculationDto extends createZodDto(CalculationSchema) {}
