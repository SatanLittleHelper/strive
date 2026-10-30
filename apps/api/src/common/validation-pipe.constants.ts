import type { ValidationPipeOptions } from '@nestjs/common';

// без enableImplicitConversion: он опирается на метаданные типов, которых нет в dev-запуске через tsx;
// числовые поля DTO задаются явно через @Type, и dev ведёт себя как prod
export const VALIDATION_PIPE_OPTIONS: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
};
