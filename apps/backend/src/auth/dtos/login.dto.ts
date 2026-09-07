import { createZodDto } from 'nestjs-zod';
import { LoginDtoSchema } from '@car-calculator/types';

export class LoginDto extends createZodDto(LoginDtoSchema) {}
