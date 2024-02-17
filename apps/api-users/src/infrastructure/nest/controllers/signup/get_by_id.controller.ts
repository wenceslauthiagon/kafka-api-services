import { Controller, Logger, Get, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEnum, IsUUID } from 'class-validator';
import {
  Public,
  KafkaServiceParam,
  LoggerParam,
  DefaultApiHeaders,
} from '@zro/common';
import { SignupState } from '@zro/signup/domain';
import { GetSignupByIdServiceKafka } from '@zro/signup/infrastructure';
import {
  GetSignupByIdRequest,
  GetSignupByIdResponse,
} from '@zro/signup/interface';

class GetSignupByIdParams {
  @ApiProperty({
    description: 'Signup ID.',
  })
  @IsUUID(4)
  id!: string;
}

class GetSignupByIdRestResponse {
  @ApiProperty({
    description: 'Signup ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id: string;

  @ApiProperty({
    description: 'State of the signup.',
    example: 'PENDING',
  })
  @IsEnum(SignupState)
  state: SignupState;

  constructor(props: GetSignupByIdResponse) {
    this.id = props.id;
    this.state = props.state;
  }
}

/**
 * Get Signup by id controller.
 */
@ApiTags('Signup')
@Public()
@DefaultApiHeaders()
@Controller('signup/:id')
export class GetSignupByIdRestController {
  /**
   * Get signup by id endpoint.
   */
  @ApiOperation({
    summary: 'Signup.',
    description: 'Get signup by id.',
  })
  @ApiOkResponse({
    description: 'Signup id and state returned successfully.',
    type: GetSignupByIdRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  @Throttle(1, 1)
  async execute(
    @KafkaServiceParam(GetSignupByIdServiceKafka)
    service: GetSignupByIdServiceKafka,
    @LoggerParam(GetSignupByIdRestController)
    logger: Logger,
    @Param() params: GetSignupByIdParams,
  ): Promise<GetSignupByIdRestResponse> {
    // Create a payload.
    const payload: GetSignupByIdRequest = {
      id: params.id,
    };

    logger.debug('Get signup by id.', { payload });

    // Call get signup by id service.
    const result = await service.execute(payload);

    logger.debug('Got signup by id.', { result });

    const response = result && new GetSignupByIdRestResponse(result);

    return response;
  }
}
