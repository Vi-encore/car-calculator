import { createZodDto } from 'nestjs-zod';
import { UpdatePasswordDtoSchema } from '@car-calculator/types';

export class UpdatePasswordDto extends createZodDto(UpdatePasswordDtoSchema) {}
