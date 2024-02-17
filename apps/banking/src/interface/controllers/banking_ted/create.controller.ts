import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { IsIsoStringDateFormat, AutoValidator, IsCpfOrCnpj } from '@zro/common';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';
import {
  BankingTed,
  BankingTedRepository,
  BankTedRepository,
} from '@zro/banking/domain';
import {
  CreateBankingTedUseCase as UseCase,
  UserService,
  QuotationService,
} from '@zro/banking/application';
import {
  BankingTedEventEmitterController,
  BankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type OperationId = Operation['id'];

type TCreateBankingTedRequest = Pick<
  BankingTed,
  | 'beneficiaryBankCode'
  | 'beneficiaryBankName'
  | 'beneficiaryName'
  | 'beneficiaryType'
  | 'beneficiaryDocument'
  | 'beneficiaryAgency'
  | 'beneficiaryAccount'
  | 'beneficiaryAccountDigit'
  | 'beneficiaryAccountType'
> & {
  userId: UserId;
  walletId: WalletId;
  operationId: OperationId;
  amount: number;
};

export class CreateBankingTedRequest
  extends AutoValidator
  implements TCreateBankingTedRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @IsUUID(4)
  operationId: OperationId;

  @IsInt()
  @IsPositive()
  amount: number;

  @IsString()
  @MaxLength(255)
  beneficiaryBankCode: string;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  beneficiaryBankName?: string;

  @IsString()
  @MaxLength(255)
  beneficiaryName: string;

  @IsString()
  @MaxLength(255)
  beneficiaryType: string;

  @IsNumberString()
  @IsCpfOrCnpj()
  beneficiaryDocument: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAgency: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAccount: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAccountDigit: string;

  @IsEnum(AccountType)
  beneficiaryAccountType: AccountType;

  constructor(props: TCreateBankingTedRequest) {
    super(props);
  }
}

type TCreateBankingTedResponse = Pick<BankingTed, 'id' | 'createdAt'> & {
  operationId: OperationId;
};

export class CreateBankingTedResponse
  extends AutoValidator
  implements TCreateBankingTedResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsUUID(4)
  operationId: OperationId;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ')
  createdAt?: Date;

  constructor(props: TCreateBankingTedResponse) {
    super(props);
  }
}

export class CreateBankingTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
    bankTedRepository: BankTedRepository,
    eventEmitter: BankingTedEventEmitterControllerInterface,
    userService: UserService,
    quotationService: QuotationService,
    bankingTedOperationCurrencyTag: string,
    bankingTedIntervalHour: string,
  ) {
    this.logger = logger.child({ context: CreateBankingTedController.name });

    const bankingTedEventEmitter = new BankingTedEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      bankingTedRepository,
      bankTedRepository,
      bankingTedEventEmitter,
      userService,
      quotationService,
      bankingTedOperationCurrencyTag,
      bankingTedIntervalHour,
    );
  }

  async execute(
    request: CreateBankingTedRequest,
  ): Promise<CreateBankingTedResponse> {
    this.logger.debug('Create banking ted request.', { request });

    const {
      amount,
      beneficiaryBankCode,
      beneficiaryBankName,
      beneficiaryName,
      beneficiaryType,
      beneficiaryDocument,
      beneficiaryAgency,
      beneficiaryAccount,
      beneficiaryAccountDigit,
      beneficiaryAccountType,
      userId,
      walletId,
      operationId,
    } = request;

    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });
    const operation = new OperationEntity({ id: operationId });

    const bankingTed = await this.usecase.execute(
      user,
      wallet,
      operation,
      amount,
      beneficiaryBankCode,
      beneficiaryName,
      beneficiaryType,
      beneficiaryDocument,
      beneficiaryAgency,
      beneficiaryAccount,
      beneficiaryAccountDigit,
      beneficiaryAccountType,
      beneficiaryBankName,
    );

    const response = new CreateBankingTedResponse({
      id: bankingTed.id,
      operationId: bankingTed.operation?.id,
      createdAt: bankingTed.createdAt,
    });

    this.logger.info('Created bankingTed response.', { bankingTed: response });

    return response;
  }
}
