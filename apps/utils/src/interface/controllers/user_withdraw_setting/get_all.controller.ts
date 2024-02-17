import { Logger } from 'winston';
import { IsEnum, IsInt, IsOptional, IsPositive, IsUUID } from 'class-validator';
import {
  Pagination,
  PaginationResponse,
  PaginationEntity,
  PaginationRequest,
  AutoValidator,
  Sort,
  PaginationSort,
  IsIsoStringDateFormat,
} from '@zro/common';
import { WalletEntity, Wallet } from '@zro/operations/domain';
import { GetAllUserWithdrawSettingUseCase as UseCase } from '@zro/utils/application';
import {
  UserWithdrawSetting,
  UserWithdrawSettingRepository,
  WithdrawSettingState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/utils/domain';

export enum GetAllUserWithdrawSettingRequestSort {
  CREATED_AT = 'created_at',
}

type TGetAllUserWithdrawSettingRequest = Pagination & {
  walletId: Wallet['uuid'];
};

export class GetAllUserWithdrawSettingRequest
  extends PaginationRequest
  implements TGetAllUserWithdrawSettingRequest
{
  @IsUUID(4)
  walletId: string;

  @IsOptional()
  @Sort(GetAllUserWithdrawSettingRequestSort)
  sort?: PaginationSort;

  constructor(props: TGetAllUserWithdrawSettingRequest) {
    super(props);
  }
}

type TGetAllUserWithdrawSettingResponseItem = Pick<
  UserWithdrawSetting,
  'id' | 'state' | 'type' | 'balance' | 'day' | 'weekDay' | 'createdAt'
>;

export class GetAllUserWithdrawSettingResponseItem
  extends AutoValidator
  implements TGetAllUserWithdrawSettingResponseItem
{
  @IsUUID(4)
  id: string;

  @IsEnum(WithdrawSettingState)
  state: WithdrawSettingState;

  @IsEnum(WithdrawSettingType)
  type: WithdrawSettingType;

  @IsInt()
  @IsPositive()
  balance: number;

  @IsInt()
  @IsPositive()
  @IsOptional()
  day?: number;

  @IsEnum(WithdrawSettingWeekDays)
  @IsOptional()
  weekDay?: WithdrawSettingWeekDays;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt?: Date;

  constructor(props: TGetAllUserWithdrawSettingResponseItem) {
    super(props);
  }
}

export class GetAllUserWithdrawSettingResponse extends PaginationResponse<GetAllUserWithdrawSettingResponseItem> {}

export class GetAllUserWithdrawSettingController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    withdrawRepository: UserWithdrawSettingRepository,
  ) {
    this.logger = logger.child({
      context: GetAllUserWithdrawSettingController.name,
    });

    this.usecase = new UseCase(this.logger, withdrawRepository);
  }

  async execute(
    request: GetAllUserWithdrawSettingRequest,
  ): Promise<GetAllUserWithdrawSettingResponse> {
    this.logger.debug('Get all withdrawals request.', { request });

    const { walletId, order, page, pageSize, sort } = request;

    const wallet = new WalletEntity({ uuid: walletId });
    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const result = await this.usecase.execute(pagination, wallet);

    const data = result.data.map(
      (withdraw) =>
        new GetAllUserWithdrawSettingResponseItem({
          id: withdraw.id,
          state: withdraw.state,
          type: withdraw.type,
          balance: withdraw.balance,
          day: withdraw.day,
          weekDay: withdraw.weekDay,
          createdAt: withdraw.createdAt,
        }),
    );

    const response = new GetAllUserWithdrawSettingResponse({
      ...result,
      data,
    });

    this.logger.debug('Get all withdrawals response.', { response });

    return response;
  }
}
