import { Logger } from 'winston';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import {
  WalletEntity,
  Wallet,
  Operation,
  OperationRepository,
  WalletAccountCacheRepository,
  Receipt,
  PaymentData,
  UserWalletRepository,
  WalletRepository,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  BankingService,
  GetOperationReceiptByUserAndWalletAndIdUseCase as UseCase,
  OtcService,
  PixPaymentsService,
  UserService,
} from '@zro/operations/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type TGetOperationReceiptByUserAndWalletAndIdRequest = {
  userId: UserId;
  walletId: WalletId;
  id: OperationId;
};

export class GetOperationReceiptByUserAndWalletAndIdRequest
  extends AutoValidator
  implements TGetOperationReceiptByUserAndWalletAndIdRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsUUID(4)
  id: OperationId;

  constructor(props: TGetOperationReceiptByUserAndWalletAndIdRequest) {
    super(props);
  }
}

type TGetOperationReceiptByUserAndWalletAndIdResponse = Receipt;

export class GetOperationReceiptByUserAndWalletAndIdResponse
  extends AutoValidator
  implements TGetOperationReceiptByUserAndWalletAndIdResponse
{
  @IsArray()
  @IsNotEmpty()
  paymentData!: PaymentData;

  @IsUUID(4)
  operationId!: OperationId;

  @IsString()
  @IsNotEmpty()
  paymentTitle!: string;

  @IsBoolean()
  isScheduled!: boolean;

  @IsBoolean()
  activeDevolution!: boolean;

  constructor(props: TGetOperationReceiptByUserAndWalletAndIdResponse) {
    // Default values
    props.isScheduled = props.isScheduled ?? false;
    props.activeDevolution = props.activeDevolution ?? false;

    super(props);
  }
}

export class GetOperationReceiptByUserAndWalletAndIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationRepository: OperationRepository,
    walletAccountCacheRepository: WalletAccountCacheRepository,
    userWalletRepository: UserWalletRepository,
    walletRepository: WalletRepository,
    pixPaymentsService: PixPaymentsService,
    userService: UserService,
    bankingService: BankingService,
    otcService: OtcService,
  ) {
    this.logger = logger.child({
      context: GetOperationReceiptByUserAndWalletAndIdController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      operationRepository,
      walletAccountCacheRepository,
      userWalletRepository,
      walletRepository,
      pixPaymentsService,
      userService,
      bankingService,
      otcService,
    );
  }

  async execute(
    request: GetOperationReceiptByUserAndWalletAndIdRequest,
  ): Promise<GetOperationReceiptByUserAndWalletAndIdResponse> {
    this.logger.debug('Get operation receipt by id.', { request });

    const { userId, walletId, id } = request;

    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });

    const result = await this.usecase.execute(user, wallet, id);

    const response =
      result &&
      new GetOperationReceiptByUserAndWalletAndIdResponse({
        paymentData: result.paymentData,
        operationId: result.operationId,
        paymentTitle: result.paymentTitle,
        isScheduled: result.isScheduled,
        activeDevolution: result.activeDevolution,
      });

    this.logger.debug('Get operation receipt by id response.', { response });

    return response;
  }
}
