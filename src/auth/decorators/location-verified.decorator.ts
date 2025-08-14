import { SetMetadata } from '@nestjs/common';

export const RequireLocationVerification = () =>
  SetMetadata('requireLocationVerification', true);
