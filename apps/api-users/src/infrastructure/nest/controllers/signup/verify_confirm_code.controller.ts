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
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import {
  Public,
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
} from '@zro/common';
import { SignupState } from '@zro/signup/domain';
import { VerifyConfirmCodeSignupRequest } from '@zro/signup/interface';
import { VerifyConfirmCodeServiceKafka } from '@zro/signup/infrastructure';

export class VerifyConfirmCodeParams {
  @ApiProperty({
    description: 'Signup ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

export class VerifyConfirmCodeBody {
  @ApiProperty({
    description: 'Verification code.',
    example: '00000',
  })
  @IsString()
  @Length(5, 5)
  @Matches(/^[0-9]*$/)
  confirmCode!: string;
}

export class VerifyConfirmCodeRestResponse {
  @ApiProperty({
    description: 'Signup ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    description: 'Signup state.',
    example: 'confirmed',
  })
  state!: SignupState;

  constructor(props: VerifyConfirmCodeRestResponse) {
    this.id = props.id;
    this.state = props.state;
  }
}

/**
 * User verify code controller. Controller is protected by JWT access token.
 */
@ApiTags('Signup')
@Public()
@DefaultApiHeaders()
@Controller('signup/:id/code')
export class VerifyConfirmCodeRestController {
  /**
   * Verify auth code endpoint.
   */
  @ApiOperation({
    summary: 'Confirm pending signup.',
    description: `Confirm code received by user due to new signup. This route works to ${SignupState.PENDING} state.
    If signup state is:<br>
    <ul>
      <li>${SignupState.PENDING}: signup state will change to ${SignupState.CONFIRMED}.
    </ul>
    Return signup which state is ${SignupState.CONFIRMED}`,
  })
  @ApiOkResponse({
    description: 'The signup returned successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Signup not found.',
  })
  @Post()
  @HttpCode(HttpStatus.OK)
  async execute(
    @KafkaServiceParam(VerifyConfirmCodeServiceKafka)
    verifyConfirmCodeService: VerifyConfirmCodeServiceKafka,
    @LoggerParam(VerifyConfirmCodeRestController)
    logger: Logger,
    @Body() body: VerifyConfirmCodeBody,
    @Param() params: VerifyConfirmCodeParams,
  ): Promise<VerifyConfirmCodeRestResponse> {
    // Create a payload.
    const payload: VerifyConfirmCodeSignupRequest = {
      id: params.id,
      confirmCode: body.confirmCode,
    };

    logger.debug('Verify signup auth code.', { payload });

    // Call create verify service.
    const result = await verifyConfirmCodeService.execute(payload);

    logger.debug('Signup verified.', { result });

    const response = new VerifyConfirmCodeRestResponse(result);

    return response;
  }
}
