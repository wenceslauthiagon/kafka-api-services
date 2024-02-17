import { ApiHeader } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

export function RefreshTokenApiHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'x-access-token',
      description: 'Send expired jwt access token with refresh token inside.',
      required: true,
    }),
  );
}
