import { createZodDto } from 'nestjs-zod';
import {
  ForgotPasswordDtoSchema,
  VerifyResetCodeDtoSchema,
  ResetPasswordDtoSchema,
} from '@car-calculator/types';

export class ForgotPasswordDto extends createZodDto(ForgotPasswordDtoSchema) {}
export class VerifyResetCodeDto extends createZodDto(
  VerifyResetCodeDtoSchema,
) {}
export class ResetPasswordDto extends createZodDto(ResetPasswordDtoSchema) {}
