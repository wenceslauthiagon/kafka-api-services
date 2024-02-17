import { Logger } from 'winston';
import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  KafkaServiceParam,
  LoggerParam,
  PaginationParams,
  PaginationRestResponse,
  PaginationSort,
  Sort,
  DefaultApiHeaders,
  HasPermission,
} from '@zro/common';
import { AuthUser } from '@zro/users/domain';
import { AuthWallet } from '@zro/operations/domain';
import { AuthUserParam } from '@zro/users/infrastructure';
import {
  AuthWalletParam,
  WalletApiHeader,
} from '@zro/operations/infrastructure';
import {
  GetAllUserWithdrawSettingRequest,
  GetAllUserWithdrawSettingRequestSort,
  GetAllUserWithdrawSettingResponse,
  GetAllUserWithdrawSettingResponseItem,
} from '@zro/utils/interface';
import { GetAllUserWithdrawSettingServiceKafka } from '@zro/utils/infrastructure';
import {
  WithdrawSettingState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/utils/domain';
import { IsOptional } from 'class-validator';

class GetAllUserWithdrawSettingParams extends PaginationParams {
  @ApiPropertyOptional({
    description: 'Page sort attribute.',
    enum: GetAllUserWithdrawSettingRequestSort,
  })
  @IsOptional()
  @Sort(GetAllUserWithdrawSettingRequestSort)
  sort?: PaginationSort;
}

class GetAllUserWithdrawSettingRestResponseItem {
  @ApiProperty({
    example: 'f6e2e084-29b9-4935-a059-5473b13033aa',
  })
  id!: string;

  @ApiProperty({
    enum: WithdrawSettingState,
    description: 'Withdraw state.',
    example: WithdrawSettingState.DEACTIVE,
  })
  state: WithdrawSettingState;

  @ApiProperty({
    enum: WithdrawSettingType,
    description: 'Withdraw type',
    example: WithdrawSettingType.DAILY,
  })
  type: WithdrawSettingType;

  @ApiProperty({
    description: 'Balance in R$ cents.',
    example: 1299,
  })
  balance: number;

  @ApiPropertyOptional({
    description:
      'Schedule a day to execute the withdraw. Returns value only for DAILY type',
    example: null,
    required: false,
    nullable: true,
  })
  day?: number;

  @ApiPropertyOptional({
    description:
      'Schedule a day to execute the withdraw. Returns value only for WEEKLY type',
    example: null,
    required: false,
    nullable: true,
  })
  week_day?: WithdrawSettingWeekDays;

  @ApiPropertyOptional({
    description: 'Date of created withdraw.',
    example: new Date(),
  })
  created_at?: Date;

  constructor(props: GetAllUserWithdrawSettingResponseItem) {
    this.id = props.id;
    this.state = props.state;
    this.type = props.type;
    this.balance = props.balance;
    this.day = props.day;
    this.week_day = props.weekDay;
    this.created_at = props.createdAt;
  }
}

class GetAllUserWithdrawSettingRestResponse extends PaginationRestResponse {
  @ApiProperty({
    description: 'User withdraw setting data.',
    type: [GetAllUserWithdrawSettingRestResponseItem],
  })
  data!: GetAllUserWithdrawSettingRestResponseItem[];

  constructor(props: GetAllUserWithdrawSettingResponse) {
    super(props);
    this.data = props.data.map(
      (item) => new GetAllUserWithdrawSettingRestResponseItem(item),
    );
  }
}

/**
 * User withdraw setting controller. Controller is protected by JWT access token.
 */
@ApiTags('Utils | User Withdraw Settings')
@ApiBearerAuth()
@DefaultApiHeaders()
@WalletApiHeader()
@Controller('utils/user-withdraw-settings')
@HasPermission('api-users-get-user-withdraw-settings')
export class GetAllUserWithdrawSettingRestController {
  /**
   * get all user withdraw setting endpoint.
   */
  @ApiOperation({
    summary: "List user's withdraw settings.",
    description: "Gets a list of user's withdraw settings.",
  })
  @ApiOkResponse({
    description: 'The user withdraw settings returned successfully.',
    type: GetAllUserWithdrawSettingRestResponse,
  })
  @ApiUnauthorizedResponse({
    description: 'User authentication failed.',
  })
  @ApiBadRequestResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'If any required params are missing or has invalid format or type.',
  })
  @Get()
  async execute(
    @AuthUserParam() user: AuthUser,
    @AuthWalletParam() wallet: AuthWallet,
    @Query() query: GetAllUserWithdrawSettingParams,
    @KafkaServiceParam(GetAllUserWithdrawSettingServiceKafka)
    getAllUserWithdrawSettingService: GetAllUserWithdrawSettingServiceKafka,
    @LoggerParam(GetAllUserWithdrawSettingRestController)
    logger: Logger,
  ): Promise<GetAllUserWithdrawSettingRestResponse> {
    // GetAll payload.
    const payload: GetAllUserWithdrawSettingRequest = {
      walletId: wallet.id,
      // Sort query
      page: query.page,
      pageSize: query.size,
      sort: query.sort,
      order: query.order,
    };

    logger.debug('Get all user withdraw settings.', { user, payload });

    // Call get all user withdraw settings service.
    const result = await getAllUserWithdrawSettingService.execute(payload);

    logger.debug('User withdraw settings found.', { result });

    const response = new GetAllUserWithdrawSettingRestResponse(result);

    return response;
  }
}
