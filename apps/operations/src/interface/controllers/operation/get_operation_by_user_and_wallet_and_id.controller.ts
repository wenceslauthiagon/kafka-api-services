import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  WalletAccount,
  Currency,
  WalletEntity,
  Wallet,
  Operation,
  TransactionType,
  OperationState,
  OperationRepository,
  WalletAccountCacheRepository,
  UserWalletRepository,
} from '@zro/operations/domain';
import { GetOperationByUserAndWalletAndIdUseCase as UseCase } from '@zro/operations/application';

type TGetOperationByUserAndWalletAndIdRequest = {
  userId: User['uuid'];
  walletId: Wallet['uuid'];
  id: Operation['id'];
};

export class GetOperationByUserAndWalletAndIdRequest
  extends AutoValidator
  implements TGetOperationByUserAndWalletAndIdRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  walletId: string;

  @IsUUID(4)
  id: string;

  constructor(props: TGetOperationByUserAndWalletAndIdRequest) {
    super(props);
  }
}

type TGetOperationByUserAndWalletAndIdResponse = Pick<
  Operation,
  'id' | 'fee' | 'state' | 'description' | 'revertedAt' | 'createdAt' | 'value'
> & {
  currencyId: Currency['id'];
  currencySymbol: Currency['symbol'];
  transactionId: TransactionType['id'];
  transactionTag: TransactionType['tag'];
  ownerWalletUuid?: WalletAccount['uuid'];
  beneficiaryWalletUuid?: WalletAccount['uuid'];
  operationRefId?: Operation['id'];
  chargebackId?: Operation['id'];
};

export class GetOperationByUserAndWalletAndIdResponse
  extends AutoValidator
  implements TGetOperationByUserAndWalletAndIdResponse
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fee?: number;

  @IsEnum(OperationState)
  state: OperationState;

  @IsString()
  @MaxLength(140)
  description: string;

  @IsInt()
  @Min(0)
  value: number;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format revertedAt',
  })
  revertedAt?: Date;

  @IsInt()
  @IsPositive()
  currencyId: number;

  @IsString()
  @Length(1, 255)
  currencySymbol: string;

  @IsInt()
  @IsPositive()
  transactionId: number;

  @IsString()
  @Length(1, 255)
  transactionTag: string;

  @IsOptional()
  @IsUUID(4)
  ownerWalletUuid?: string;

  @IsOptional()
  @IsUUID(4)
  beneficiaryWalletUuid?: string;

  @IsOptional()
  @IsUUID(4)
  operationRefId?: string;

  @IsOptional()
  @IsUUID(4)
  chargebackId?: string;

  constructor(props: TGetOperationByUserAndWalletAndIdResponse) {
    super(props);
  }
}

export class GetOperationByUserAndWalletAndIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationRepository: OperationRepository,
    walletAccountCacheRepository: WalletAccountCacheRepository,
    userWalletRepository: UserWalletRepository,
  ) {
    this.logger = logger.child({
      context: GetOperationByUserAndWalletAndIdController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      operationRepository,
      walletAccountCacheRepository,
      userWalletRepository,
    );
  }

  async execute(
    request: GetOperationByUserAndWalletAndIdRequest,
  ): Promise<GetOperationByUserAndWalletAndIdResponse> {
    this.logger.debug('Get operation by user and id request.', {
      request,
    });

    const { userId: userId, walletId, id } = request;

    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });

    const result = await this.usecase.execute(user, wallet, id);

    const response = new GetOperationByUserAndWalletAndIdResponse({
      id: result.id,
      fee: result.fee,
      state: result.state,
      description: result.description,
      value: result.value,
      createdAt: result.createdAt,
      revertedAt: result.revertedAt,
      currencyId: result.currency.id,
      currencySymbol: result.currency.symbol,
      transactionId: result.transactionType.id,
      transactionTag: result.transactionType.tag,
      ownerWalletUuid: result.ownerWalletAccount?.wallet?.uuid ?? null,
      beneficiaryWalletUuid:
        result.beneficiaryWalletAccount?.wallet?.uuid ?? null,
      operationRefId: result.operationRef?.id ?? null,
      chargebackId: result.chargeback?.id ?? null,
    });

    this.logger.debug('Get operation by user and id response.', {
      response,
    });

    return response;
  }
}
