import { Logger } from 'winston';
import {
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { ConfirmBankingTedUseCase as UseCase } from '@zro/banking/application';
import {
  BankingTed,
  BankingTedEntity,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';
import {
  BankingTedEventEmitterController,
  BankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';
import { AccountType } from '@zro/pix-payments/domain';

type TConfirmBankingTedRequest = Pick<
  BankingTed,
  | 'transactionId'
  | 'beneficiaryDocument'
  | 'beneficiaryBankCode'
  | 'beneficiaryAgency'
  | 'beneficiaryAccount'
  | 'beneficiaryAccountType'
  | 'amount'
>;

export class ConfirmBankingTedRequest
  extends AutoValidator
  implements TConfirmBankingTedRequest
{
  @IsUUID(4)
  transactionId: string;

  @IsString()
  @MaxLength(255)
  beneficiaryDocument: string;

  @IsString()
  @MaxLength(255)
  beneficiaryBankCode: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAgency: string;

  @IsString()
  @MaxLength(255)
  beneficiaryAccount: string;

  @IsEnum(AccountType)
  beneficiaryAccountType: AccountType;

  @IsPositive()
  @IsInt()
  amount: number;

  constructor(props: TConfirmBankingTedRequest) {
    super(props);
  }
}

type TConfirmBankingTedResponse = Pick<
  BankingTed,
  'id' | 'state' | 'createdAt'
>;

export class ConfirmBankingTedResponse
  extends AutoValidator
  implements TConfirmBankingTedResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsEnum(BankingTedState)
  state: BankingTedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TConfirmBankingTedResponse) {
    super(props);
  }
}

export class ConfirmBankingTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
    bankingTedEmitter: BankingTedEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ConfirmBankingTedController.name,
    });

    const bankingTedEventEmitter = new BankingTedEventEmitterController(
      bankingTedEmitter,
    );

    this.usecase = new UseCase(
      logger,
      bankingTedRepository,
      bankingTedEventEmitter,
    );
  }

  async execute(
    request: ConfirmBankingTedRequest,
  ): Promise<ConfirmBankingTedResponse> {
    const {
      transactionId,
      beneficiaryDocument,
      beneficiaryBankCode,
      beneficiaryAgency,
      beneficiaryAccount,
      beneficiaryAccountType,
      amount,
    } = request;

    this.logger.debug('Confirm ted by ID request.', { request });

    const payload = new BankingTedEntity({
      transactionId,
      beneficiaryDocument,
      beneficiaryBankCode,
      beneficiaryAgency,
      beneficiaryAccount,
      beneficiaryAccountType,
      amount,
    });
    const bankingTed = await this.usecase.execute(payload);

    if (!bankingTed) return null;

    const response = new ConfirmBankingTedResponse({
      id: bankingTed.id,
      state: bankingTed.state,
      createdAt: bankingTed.createdAt,
    });

    this.logger.info('Confirm ted by ID response.', {
      bankingTed: response,
    });

    return response;
  }
}
