import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Login request DTO.
 */
export class AuthenticateRestRequest {
  @ApiProperty({
    description: 'Client UUID.',
    example: 'f6de19a2-defb-45b0-906b-3dcbf6d707ed',
  })
  @IsUUID(4)
  clientId: string;

  @ApiProperty({
    description: 'Client secret.',
    example: '1b9d9bcb-95a2-4ad5-8af7-227ed99c45e7',
  })
  @IsUUID(4)
  clientSecret: string;
}

/**
 * Login response DTO.
 */
export class AuthenticateRestResponse {
  @ApiProperty({
    type: 'string',
    description:
      'JWT access token. Token used to access all protected endpoints.',
  })
  accessToken: string;
}
