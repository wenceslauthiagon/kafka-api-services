import { Controller, Logger, Param, Get } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import {
  DefaultApiHeaders,
  HasPermission,
  KafkaServiceParam,
  LoggerParam,
  cpfMask,
  isCpf,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import {
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/compliance/domain';
import { KeyType } from '@zro/pix-keys/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import { GetUserWithdrawSettingRequestByUserAndIdServiceKafka } from '@zro/compliance/infrastructure';
import {
  GetUserWithdrawSettingRequestByUserAndIdRequest,
  GetUserWithdrawSettingRequestByUserAndIdResponse,
} from '@zro/compliance/interface';

class GetUserWithdrawSettingRequestByUserAndIdParams {
  @ApiProperty({
    description: 'User withdraw setting request id.',
  })
  @IsUUID(4)
  id!: string;
}

class GetUserWithdrawSettingRequestByUserAndIdRestResponse {
  @ApiProperty({
    description: 'User withdraw settings request id.',
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id: string;

  @ApiProperty({
    description: 'User withdraw setting request analysis result.',
    enum: UserWithdrawSettingRequestAnalysisResultType,
  })
  analysis_result: UserWithdrawSettingRequestAnalysisResultType;

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

  @ApiProperty({
    description: 'User withdraw setting request creation date.',
    example: new Date(),
  })
  created_at: Date;

  @ApiProperty({
    description: 'User withdraw setting request update date.',
    example: new Date(),
  })
  updated_at: Date;

  @ApiPropertyOptional({
    description: 'User withdraw setting request close date.',
    example: new Date(),
  })
  closed_at: Date;

  constructor(props: GetUserWithdrawSettingRequestByUserAndIdResponse) {
    this.id = props.id;
    this.analysis_result = props.analysisResult;
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
    this.created_at = props.createdAt;
    this.updated_at = props.updatedAt;
    this.closed_at = props.closedAt;
  }
}

/**
 * User withdraw setting request get by id controller.
 */
@ApiTags('Compliance | Withdraw setting request')
@ApiBearerAuth()
@DefaultApiHeaders()
@Controller('withdraw-setting-request/:id')
@HasPermission('api-paas-get-withdraw-setting-request-by-id')
export class GetUserWithdrawSettingRequestByIdController {
  /**
   * Get user withdraw setting request endpoint.
   */
  @ApiOperation({
    summary: 'Get user withdraw settings request.',
    description: 'Endpoint to user get a withdraw settings request by id.',
  })
  @ApiResponse({
    description: 'User withdraw settings request returned successfully.',
    type: GetUserWithdrawSettingRequestByUserAndIdRestResponse,
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @Param() params: GetUserWithdrawSettingRequestByUserAndIdParams,
    @KafkaServiceParam(GetUserWithdrawSettingRequestByUserAndIdServiceKafka)
    createUserWithdrawSettingRequestByUserAndIdService: GetUserWithdrawSettingRequestByUserAndIdServiceKafka,
    @LoggerParam(GetUserWithdrawSettingRequestByIdController)
    logger: Logger,
  ): Promise<GetUserWithdrawSettingRequestByUserAndIdRestResponse> {
    // Get a payload.
    const payload: GetUserWithdrawSettingRequestByUserAndIdRequest = {
      id: params.id,
      userId: user.uuid,
    };

    logger.debug('Get user withdraw setting request by id.', { payload });

    // Call get user withdraw setting request service.
    const result =
      await createUserWithdrawSettingRequestByUserAndIdService.execute(payload);

    logger.debug('User withdraw setting request found.', { result });

    const response = new GetUserWithdrawSettingRequestByUserAndIdRestResponse(
      result,
    );

    return response;
  }
}
