import { createZodDto } from 'nestjs-zod';
import { CalculationSchema } from '@car-calculator/types';

export class CalculationDto extends createZodDto(CalculationSchema) {}
