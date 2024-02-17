import { Body, Controller, Logger, Post } from '@nestjs/common';
import {
  IsUUID,
  IsInt,
  IsEnum,
  IsString,
  Length,
  Min,
  IsPositive,
  MaxLength,
  ValidateIf,
  IsIn,
  IsOptional,
} from 'class-validator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  DefaultApiHeaders,
  HasPermission,
  IsCpfOrCnpj,
  KafkaServiceParam,
  LoggerParam,
  RequestTransactionId,
  cpfMask,
  isCpf,
  TransactionApiHeader,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import {
  UserWithdrawSettingRequestState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/compliance/domain';
import { KeyType } from '@zro/pix-keys/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { CreateUserWithdrawSettingRequestServiceKafka } from '@zro/compliance/infrastructure';
import {
  CreateUserWithdrawSettingRequest,
  CreateUserWithdrawSettingRequestResponse,
} from '@zro/compliance/interface';

class CreateUserWithdrawSettingRequestBody {
  @ApiProperty({
    description: 'User wallet id id.',
    example: '3267dfe0-73ee-4421-80e7-0c3a5372fa13',
  })
  @IsUUID(4)
  wallet_id!: string;

  @ApiProperty({
    description: 'Transaction type tag.',
    example: 'PIXSEND',
  })
  @IsString()
  @Length(1, 255)
  transaction_type_tag: string;

  @ApiProperty({
    description: 'Pix key type.',
    enum: KeyType,
  })
  @IsEnum(KeyType)
  pix_key_type: KeyType;

  @ApiProperty({ description: 'Pix key.' })
  @IsString()
  @MaxLength(77)
  pix_key: string;

  @ApiPropertyOptional({
    description: 'Pix key document related (CPF or CNPJ).',
    example: '00000000000',
  })
  @IsOptional()
  @IsCpfOrCnpj()
  pix_key_document?: string;

  @ApiProperty({
    description: 'Withdraw settings type.',
    enum: WithdrawSettingType,
  })
  @IsEnum(WithdrawSettingType)
  type: WithdrawSettingType;

  @ApiProperty({
    description: 'Withdraw settings balance.',
    example: 1000000,
  })
  @IsInt()
  @IsPositive()
  @Min(100)
  balance: number;

  @ApiPropertyOptional({
    description:
      'Month day of withdraw (if withdraw settings type is MONTHLY).',
    example: 10,
  })
  @ValidateIf(
    (body: CreateUserWithdrawSettingRequestBody) =>
      body.type === WithdrawSettingType.MONTHLY,
  )
  @IsInt()
  @IsPositive()
  @IsIn([5, 15, 25])
  day?: number;

  @ApiPropertyOptional({
    description: 'Week day of withdraw (if withdraw settings type is WEEKLY).',
    enum: WithdrawSettingWeekDays,
  })
  @ValidateIf(
    (body: CreateUserWithdrawSettingRequestBody) =>
      body.type === WithdrawSettingType.WEEKLY,
  )
  @IsEnum(WithdrawSettingWeekDays)
  week_day?: WithdrawSettingWeekDays;
}

class CreateUserWithdrawSettingRequestRestResponse {
  @ApiProperty({
    description: 'User withdraw settings request id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'User withdraw settings request state.',
    enum: UserWithdrawSettingRequestState,
  })
  state: UserWithdrawSettingRequestState;

  @ApiProperty({
    description: 'User wallet id.',
    example: '3267dfe0-73ee-4421-80e7-0c3a5372fa13',
  })
  wallet_id!: string;

  @ApiProperty({
    description: 'Transaction type tag.',
    example: 'PIXSEND',
  })
  transaction_type_tag: string;

  @ApiProperty({
    description: 'Pix key type.',
    enum: KeyType,
  })
  pix_key_type: KeyType;

  @ApiProperty({ description: 'Pix key.' })
  pix_key: string;

  @ApiPropertyOptional({
    description: 'Pix key document related (CPF or CNPJ).',
    example: '00000000000',
  })
  pix_key_document?: string;

  @ApiProperty({
    description: 'Withdraw settings type.',
    enum: WithdrawSettingType,
  })
  type: WithdrawSettingType;

  @ApiProperty({
    description: 'Withdraw settings balance.',
    example: 1000000,
  })
  balance: number;

  @ApiPropertyOptional({
    description:
      'Month day of withdraw (if withdraw settings type is MONTHLY).',
    example: 10,
  })
  day?: number;

  @ApiPropertyOptional({
    description: 'Week day of withdraw (if withdraw settings type is WEEKLY).',
    enum: WithdrawSettingWeekDays,
  })
  week_day?: WithdrawSettingWeekDays;

  constructor(props: CreateUserWithdrawSettingRequestResponse) {
    this.id = props.id;
    this.state = props.state;
    this.wallet_id = props.walletId;
    this.transaction_type_tag = props.transactionTypeTag;
    this.pix_key_type = props.pixKeyType;
    this.pix_key = props.pixKey;
    this.pix_key_document = isCpf(props.pixKeyDocument)
      ? cpfMask(props.pixKeyDocument)
      : props.pixKeyDocument;
    this.type = props.type;
    this.balance = props.balance;
    this.day = props.day;
    this.week_day = props.weekDay;
  }
}

/**
 * User withdraw setting request create controller.
 */
@ApiTags('Compliance | Withdraw setting request')
@ApiBearerAuth()
@DefaultApiHeaders()
@TransactionApiHeader()
@Controller('withdraw-setting-request')
@HasPermission('api-paas-post-withdraw-setting-request')
export class CreateUserWithdrawSettingRequestRestController {
  /**
   * Create user withdraw setting request endpoint.
   */
  @ApiOperation({
    summary: 'Create user withdraw settings request.',
    description: 'Endpoint to user create a withdraw settings request.',
  })
  @ApiCreatedResponse({
    description: 'User withdraw settings request created successfully.',
    type: CreateUserWithdrawSettingRequestRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Post()
  async execute(
    @AuthUserParam() user: AuthUser,
    @KafkaServiceParam(CreateUserWithdrawSettingRequestServiceKafka)
    createUserWithdrawSettingRequestService: CreateUserWithdrawSettingRequestServiceKafka,
    @LoggerParam(CreateUserWithdrawSettingRequestRestController)
    logger: Logger,
    @RequestTransactionId() transactionId: string,
    @Body() body: CreateUserWithdrawSettingRequestBody,
  ): Promise<CreateUserWithdrawSettingRequestRestResponse> {
    // Create a payload.
    const payload: CreateUserWithdrawSettingRequest = {
      id: transactionId,
      userId: user.uuid,
      walletId: body.wallet_id,
      transactionTypeTag: body.transaction_type_tag,
      pixKeyType: body.pix_key_type,
      pixKey: body.pix_key,
      pixKeyDocument: body.pix_key_document,
      type: body.type,
      balance: body.balance,
      day: body.day,
      weekDay: body.week_day,
    };

    logger.debug('Create new user withdraw setting request.', { payload });

    // Call create user withdraw setting request service.
    const result =
      await createUserWithdrawSettingRequestService.execute(payload);

    logger.debug('User withdraw setting request created.', { result });

    const response = new CreateUserWithdrawSettingRequestRestResponse(result);

    return response;
  }
}
