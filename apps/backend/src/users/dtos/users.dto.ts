import { createZodDto } from 'nestjs-zod';
import {
  UpdateProfileDtoSchema,
  UpdatePasswordDtoSchema,
} from '@car-calculator/types';

export class UpdateProfileDto extends createZodDto(UpdateProfileDtoSchema) {}
export class UpdatePasswordDto extends createZodDto(UpdatePasswordDtoSchema) {}
