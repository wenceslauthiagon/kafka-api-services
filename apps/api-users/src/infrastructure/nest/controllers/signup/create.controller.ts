import { Body, Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
  IsEmail,
  IsEnum,
} from 'class-validator';
import {
  KafkaServiceParam,
  LoggerParam,
  BcryptHashService,
  MinLength,
  MaxLength,
  IsMobilePhone,
  Public,
  DefaultApiHeaders,
  RequestTransactionId,
  TransactionApiHeader,
} from '@zro/common';
import { SignupState } from '@zro/signup/domain';
import { RecaptchaGuard, RecaptchaBody } from '@zro/api-users/infrastructure';
import { CreateSignupServiceKafka } from '@zro/signup/infrastructure';
import {
  CreateSignupRequest,
  CreateSignupResponse,
} from '@zro/signup/interface';

class CreateUserBody extends RecaptchaBody {
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
    description: 'Client password.',
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
  @IsString()
  @MaxLength(20)
  @IsOptional()
  received_referral_code?: string;

  @ApiProperty({
    description: 'Client Email.',
    example: 'james@bond.com',
    required: true,
  })
  @IsEmail()
  email!: string;
}

class CreateUserRestResponse {
  @ApiProperty({
    description: 'Signup ID.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
    required: true,
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

  constructor(props: CreateSignupResponse) {
    this.id = props.id;
    this.state = props.state;
  }
}

interface CreateSignupRestConfig {
  APP_SIGNUP_SALT_ROUNDS: number;
}

/**
 * Signup create controller.
 */
@ApiTags('Signup')
@Public()
@DefaultApiHeaders()
@TransactionApiHeader()
@Controller('signup')
@UseGuards(RecaptchaGuard)
export class CreateSignupRestController {
  private readonly saltRounds: number;

  constructor(
    private readonly hashService: BcryptHashService,
    readonly configService: ConfigService<CreateSignupRestConfig>,
  ) {
    this.saltRounds = configService.get<number>('APP_SIGNUP_SALT_ROUNDS', 10);
  }
  /**
   * create signup endpoint.
   */
  @ApiOperation({
    summary: 'Signup.',
    description:
      'Create signup request using name and phone number, password, email and referralCode.',
  })
  @ApiCreatedResponse({
    description: 'Signup created successfully.',
    type: CreateUserRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  @Throttle(1, 1)
  async execute(
    @KafkaServiceParam(CreateSignupServiceKafka)
    createService: CreateSignupServiceKafka,
    @LoggerParam(CreateSignupRestController) logger: Logger,
    @RequestTransactionId() transactionId: string,
    @Body() body: CreateUserBody,
  ): Promise<CreateUserRestResponse> {
    const passwordHash =
      body.password &&
      this.hashService.hashSync(body.password, this.saltRounds);
    // Create a payload.
    const payload: CreateSignupRequest = {
      id: transactionId,
      name: body.name,
      phoneNumber: body.phone_number?.replace(/\+550/, '+55'),
      password: passwordHash,
      referralCode: body.received_referral_code,
      email: body.email.trim(),
    };

    logger.debug('Create new signup.', { payload });

    // Call create signup service.
    const result = await createService.execute(payload);

    logger.debug('Signup created.', { result });

    const response = result && new CreateUserRestResponse(result);

    return response;
  }
}
