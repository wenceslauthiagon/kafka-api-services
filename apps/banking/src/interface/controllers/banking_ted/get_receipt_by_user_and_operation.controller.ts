import { Logger } from 'winston';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { BankingTedReceipt, BankingTedRepository } from '@zro/banking/domain';
import {
  GetBankingTedReceiptByUserAndOperationUseCase as UseCase,
  UserService,
} from '@zro/banking/application';
import {
  Operation,
  OperationEntity,
  PaymentData,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';

type OperationId = Operation['id'];
type UserId = User['uuid'];

type TGetBankingTedReceiptByUserAndOperationRequest = {
  userId: UserId;
  operationId: OperationId;
};

export class GetBankingTedReceiptByUserAndOperationRequest
  extends AutoValidator
  implements TGetBankingTedReceiptByUserAndOperationRequest
{
  @IsUUID(4)
  userId: string;

  @IsUUID(4)
  operationId: string;

  constructor(props: TGetBankingTedReceiptByUserAndOperationRequest) {
    super(props);
  }
}

type TGetBankingTedReceiptByUserAndOperationResponse = BankingTedReceipt;

export class GetBankingTedReceiptByUserAndOperationResponse
  extends AutoValidator
  implements TGetBankingTedReceiptByUserAndOperationResponse
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

  constructor(props: TGetBankingTedReceiptByUserAndOperationResponse) {
    super(props);
  }
}

export class GetBankingTedReceiptByUserAndOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
    userService: UserService,
  ) {
    this.logger = logger.child({
      context: GetBankingTedReceiptByUserAndOperationController.name,
    });

    this.usecase = new UseCase(this.logger, bankingTedRepository, userService);
  }

  async execute(
    request: GetBankingTedReceiptByUserAndOperationRequest,
  ): Promise<GetBankingTedReceiptByUserAndOperationResponse> {
    this.logger.debug('Getting bankingTed by id request.', { request });

    const { userId, operationId } = request;

    const user = new UserEntity({ uuid: userId });
    const operation = new OperationEntity({ id: operationId });

    const receipt = await this.usecase.execute(user, operation);

    const response =
      receipt &&
      new GetBankingTedReceiptByUserAndOperationResponse({
        paymentData: receipt.paymentData,
        paymentTitle: receipt.paymentTitle,
        operationId: receipt.operationId,
        isScheduled: receipt.isScheduled,
        activeDevolution: receipt.activeDevolution,
      });

    this.logger.info('Getting bankingTed receipt.', {
      receipt: response,
    });

    return response;
  }
}
