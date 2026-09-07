import { createZodDto } from 'nestjs-zod';
import { UpdateProfileDtoSchema } from '@car-calculator/types';

export class UpdateProfileDto extends createZodDto(UpdateProfileDtoSchema) {}
