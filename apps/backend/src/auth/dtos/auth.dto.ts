import { createZodDto } from 'nestjs-zod';
import { LoginDtoSchema, RegisterDtoSchema } from '@car-calculator/types';

export class LoginDto extends createZodDto(LoginDtoSchema) {}

export class RegisterDto extends createZodDto(RegisterDtoSchema) {}
