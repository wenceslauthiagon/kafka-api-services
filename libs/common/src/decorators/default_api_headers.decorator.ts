import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export function DefaultApiHeaders() {
  return applyDecorators(
    ApiHeader({
      name: 'nonce',
      description:
        'The nonce ID is a UUID (v4) used to uniquely identify the requisition. All requisitions must have an identifier.',
      required: true,
    }),
  );
}
