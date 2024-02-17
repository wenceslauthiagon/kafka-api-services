import { Body, Controller, Logger, Param, Patch } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsUUID,
  IsNotEmpty,
  IsEmail,
  IsEnum,
} from 'class-validator';
import {
  BcryptHashService,
  IsMobilePhone,
  KafkaServiceParam,
  LoggerParam,
  Public,
  DefaultApiHeaders,
} from '@zro/common';
import { SignupState } from '@zro/signup/domain';
import { UpdateSignupServiceKafka } from '@zro/signup/infrastructure';
import {
  UpdateSignupRequest,
  UpdateSignupResponse,
} from '@zro/signup/interface';

class UpdateSignupParams {
  @ApiProperty({
    description: 'Signup ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id!: string;
}

class UpdateSignupBody {
  @ApiProperty({
    description: 'Client name.',
    example: 'James Bond',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  name?: string;

  @ApiProperty({
    description: 'Client phone number. Symbol + is optional.',
    example: '+5581987654321',
    required: false,
  })
  @IsOptional()
  @IsMobilePhone()
  phone_number?: string;

  @ApiProperty({
    description: 'Client password',
    example: '007GoldenEye',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    description: 'Referral code sent by App Store or Play Store.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  received_referral_code?: string;

  @ApiProperty({
    description: 'Client Email',
    example: 'james@bond.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}

class UpdateSignupRestResponse {
  @ApiProperty({
    description: 'Signup ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  @IsUUID(4)
  id: string;

  @ApiProperty({
    description: 'Signup state.',
    example: SignupState.PENDING,
    required: true,
  })
  @IsEnum(SignupState)
  state: SignupState;

  constructor(props: UpdateSignupResponse) {
    this.id = props.id;
    this.state = props.state;
  }
}

interface UpdateSignupRestConfig {
  APP_SIGNUP_SALT_ROUNDS: number;
}

/**
 * Signup update controller.
 */
@ApiTags('Signup')
@Public()
@DefaultApiHeaders()
@Controller('signup/:id')
export class UpdateSignupRestController {
  private readonly saltRounds: number;

  constructor(
    private readonly hashService: BcryptHashService,
    configService: ConfigService<UpdateSignupRestConfig>,
  ) {
    this.saltRounds = configService.get<number>('APP_SIGNUP_SALT_ROUNDS', 10);
  }

  /**
   * update signup endpoint.
   */
  @ApiOperation({
    summary: 'Signup.',
    description:
      'Update signup request using name and phone number, password, email and referralCode.',
  })
  @ApiOkResponse({
    description: 'Signup updated successfully.',
    type: UpdateSignupRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Patch()
  async execute(
    @KafkaServiceParam(UpdateSignupServiceKafka)
    updateService: UpdateSignupServiceKafka,
    @LoggerParam(UpdateSignupRestController)
    logger: Logger,
    @Param() params: UpdateSignupParams,
    @Body() body: UpdateSignupBody,
  ): Promise<UpdateSignupRestResponse> {
    const passwordHash =
      body.password &&
      this.hashService.hashSync(body.password, this.saltRounds);
    // Update a payload.
    const payload: UpdateSignupRequest = {
      id: params.id,
      name: body.name,
      phoneNumber: body.phone_number?.replace(/\+550/, '+55'),
      password: passwordHash,
      referralCode: body.received_referral_code,
      email: body.email.trim(),
    };

    logger.debug('Update signup.', { payload });

    // Call update signup service.
    const result = await updateService.execute(payload);

    logger.debug('Signup updated.', { result });

    const response = new UpdateSignupRestResponse(result);

    return response;
  }
}
