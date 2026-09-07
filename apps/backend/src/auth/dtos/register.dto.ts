import { createZodDto } from 'nestjs-zod';
import { RegisterDtoSchema } from '@car-calculator/types';

export class RegisterDto extends createZodDto(RegisterDtoSchema) {}
