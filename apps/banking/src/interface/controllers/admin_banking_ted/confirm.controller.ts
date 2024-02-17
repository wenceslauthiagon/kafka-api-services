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
import {
  AdminBankingAccountEntity,
  AdminBankingAccountRepository,
  AdminBankingTed,
  AdminBankingTedEntity,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import { ConfirmAdminBankingTedUseCase as UseCase } from '@zro/banking/application';
import {
  AdminBankingTedEventEmitterController,
  AdminBankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';
import { AccountType } from '@zro/pix-payments/domain';

type TConfirmAdminBankingTedRequest = Pick<
  AdminBankingTed,
  'transactionId' | 'value'
> & {
  beneficiaryDocument: string;
  beneficiaryBankCode: string;
  beneficiaryAgency: string;
  beneficiaryAccount: string;
  beneficiaryAccountType: string;
};

export class ConfirmAdminBankingTedRequest
  extends AutoValidator
  implements TConfirmAdminBankingTedRequest
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
  value: number;

  constructor(props: TConfirmAdminBankingTedRequest) {
    super(props);
  }
}

type TConfirmAdminBankingTedResponse = Pick<
  AdminBankingTed,
  'id' | 'state' | 'createdAt'
>;

export class ConfirmAdminBankingTedResponse
  extends AutoValidator
  implements TConfirmAdminBankingTedResponse
{
  @IsUUID()
  id: string;

  @IsEnum(AdminBankingTedState)
  state: AdminBankingTedState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TConfirmAdminBankingTedResponse) {
    super(props);
  }
}

export class ConfirmAdminBankingTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankingTedRepository: AdminBankingTedRepository,
    bankingAccountRepository: AdminBankingAccountRepository,
    bankingTedEmitter: AdminBankingTedEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ConfirmAdminBankingTedController.name,
    });

    const bankingTedEventEmitter = new AdminBankingTedEventEmitterController(
      bankingTedEmitter,
    );

    this.usecase = new UseCase(
      logger,
      bankingTedRepository,
      bankingAccountRepository,
      bankingTedEventEmitter,
    );
  }

  async execute(
    request: ConfirmAdminBankingTedRequest,
  ): Promise<ConfirmAdminBankingTedResponse> {
    const {
      transactionId,
      beneficiaryDocument,
      beneficiaryBankCode,
      beneficiaryAgency,
      beneficiaryAccount,
      beneficiaryAccountType,
      value,
    } = request;

    this.logger.debug('Confirm ted by ID request.', { request });

    const destination = new AdminBankingAccountEntity({
      document: beneficiaryDocument,
      bankCode: beneficiaryBankCode,
      branchNumber: beneficiaryAgency,
      accountNumber: beneficiaryAccount,
      accountType: beneficiaryAccountType,
    });

    const payload = new AdminBankingTedEntity({
      transactionId,
      destination,
      value,
    });
    const bankingTed = await this.usecase.execute(payload);

    if (!bankingTed) return null;

    const response = new ConfirmAdminBankingTedResponse({
      id: bankingTed.id,
      state: bankingTed.state,
      createdAt: bankingTed.createdAt,
    });

    this.logger.info('Confirm admin ted by ID response.', {
      bankingTed: response,
    });

    return response;
  }
}
