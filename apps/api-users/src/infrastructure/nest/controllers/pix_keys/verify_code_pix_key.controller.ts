import {
  Controller,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { IsString, IsUUID, Length, Matches } from 'class-validator';
import { Logger } from 'winston';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { ClaimReasonType, KeyState, KeyType } from '@zro/pix-keys/domain';
import {
  VerifyCodePixKeyRequest,
  VerifyCodePixKeyResponse,
} from '@zro/pix-keys/interface';
import { pixKeyTypeRest, pixKeyStateRest } from '@zro/api-users/infrastructure';
import { VerifyCodePixKeyServiceKafka } from '@zro/pix-keys/infrastructure';

export class VerifyCodePixKeyParams {
  @ApiProperty({
    description: 'Pix Key ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export class VerifyCodePixKeyBody {
  @ApiProperty({
    description: 'Verification code.',
    example: '00000',
  })
  @IsString()
  @Length(5, 5)
  @Matches(/^[0-9]*$/)
  code!: string;
}

export class VerifyCodePixKeyRestResponse {
  @ApiProperty({
    description: 'Pix Key ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Pix key.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  key!: string;

  @ApiProperty(pixKeyTypeRest)
  type!: KeyType;

  @ApiProperty(pixKeyStateRest)
  state!: KeyState;

  @ApiProperty({
    description: 'Pix Key created at.',
    example: new Date(),
  })
  created_at!: Date;

  constructor(props: VerifyCodePixKeyResponse) {
    this.id = props.id;
    this.key = props.key;
    this.type = props.type;
    this.state = props.state;
    this.created_at = props.createdAt;
  }
}

/**
 * User pix keys controller. Controller is protected by JWT access token.
 */
@ApiTags('Pix | Keys')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('pix/keys/:id/code')
@HasPermission('api-users-post-pix-keys-verify-code-by-id')
export class VerifyCodePixKeyRestController {
  /**
   * Verify pixKey code endpoint.
   */
  @ApiOperation({
    summary: 'Confirm pending key code.',
    description: `Confirm code received by user due to adding/claim key request. This route works to ${KeyState.PENDING} and ${KeyState.CLAIM_PENDING} states.
    If key state is:<br>
    <ul>
      <li>${KeyState.PENDING}: key state will change to ${KeyState.CONFIRMED}.
      <li>${KeyState.CLAIM_PENDING}: key state will change to ${KeyState.CLAIM_DENIED} and a claim cancel message will be sent to DICT.
    </ul>
    Return key which state is ${KeyState.CONFIRMED} and ${KeyState.CLAIM_DENIED}.`,
  })
  @ApiOkResponse({
    description: 'The pix key returned successfully.',
    type: VerifyCodePixKeyRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Key not found.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async execute(
    @AuthUserParam() user: AuthUser,
    @Body() body: VerifyCodePixKeyBody,
    @Param() params: VerifyCodePixKeyParams,
    @KafkaServiceParam(VerifyCodePixKeyServiceKafka)
    service: VerifyCodePixKeyServiceKafka,
    @LoggerParam(VerifyCodePixKeyRestController)
    logger: Logger,
  ): Promise<VerifyCodePixKeyRestResponse> {
    // Create a payload.
    const payload: VerifyCodePixKeyRequest = {
      userId: user.uuid,
      id: params.id,
      code: body.code,
      reason: ClaimReasonType.FRAUD,
    };

    logger.debug('Verify pixKey code.', { user, payload });

    // Call create pixKey service.
    const result = await service.execute(payload);

    logger.debug('PixKey verified.', { result });

    const response = new VerifyCodePixKeyRestResponse(result);

    return response;
  }
}
