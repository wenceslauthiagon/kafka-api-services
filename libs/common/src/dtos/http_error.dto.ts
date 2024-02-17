import { ApiProperty } from '@nestjs/swagger';

export class HttpErrorResponse {
  @ApiProperty({
    description: 'Additional error info',
    required: false,
  })
  data?: any;

  @ApiProperty({
    description: 'Error code',
  })
  code: string;

  @ApiProperty({
    description: 'User friendly error message',
  })
  message: string;
}
