import { Logger } from 'winston';
import {
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  AdminBankingAccountRepository,
  AdminBankingTedRepository,
  BankingTed,
  BankingTedRepository,
} from '@zro/banking/domain';
import {
  GetBankingTedByTransactionIdController,
  ConfirmBankingTedController,
  BankingTedEventEmitterControllerInterface,
  GetAdminBankingTedByTransactionIdController,
  ConfirmAdminBankingTedController,
  AdminBankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';
import { BankingTedNotFoundException } from '@zro/banking/application';
import { AccountType } from '@zro/pix-payments/domain';

type TConfirmTedRequest = Pick<
  BankingTed,
  | 'transactionId'
  | 'beneficiaryDocument'
  | 'beneficiaryBankCode'
  | 'beneficiaryAgency'
  | 'beneficiaryAccount'
  | 'beneficiaryAccountType'
  | 'amount'
>;

export class ConfirmTedRequest
  extends AutoValidator
  implements TConfirmTedRequest
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

  @IsString()
  beneficiaryAccountType: AccountType;

  @IsPositive()
  @IsInt()
  amount: number;

  constructor(props: TConfirmTedRequest) {
    super(props);
  }
}

type TConfirmTedResponse = {
  id: string;
  createdAt: Date;
};

export class ConfirmTedResponse
  extends AutoValidator
  implements TConfirmTedResponse
{
  @IsUUID()
  id: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TConfirmTedResponse) {
    super(props);
  }
}

export class ConfirmTedController {
  private readonly confirmBankingTed: ConfirmBankingTedController;
  private readonly confirmAdminBankingTedController: ConfirmAdminBankingTedController;
  private readonly getBankingTedByTransactionIdController: GetBankingTedByTransactionIdController;
  private readonly getAdminBankingTedByTransactionIdController: GetAdminBankingTedByTransactionIdController;

  constructor(
    private logger: Logger,
    bankingTedRepository: BankingTedRepository,
    adminBankingTedRepository: AdminBankingTedRepository,
    bankingAccountRepository: AdminBankingAccountRepository,
    bankingTedEmitter: BankingTedEventEmitterControllerInterface,
    adminBankingTedEmitter: AdminBankingTedEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: ConfirmAdminBankingTedController.name,
    });

    this.getBankingTedByTransactionIdController =
      new GetBankingTedByTransactionIdController(logger, bankingTedRepository);

    this.confirmBankingTed = new ConfirmBankingTedController(
      logger,
      bankingTedRepository,
      bankingTedEmitter,
    );

    this.getAdminBankingTedByTransactionIdController =
      new GetAdminBankingTedByTransactionIdController(
        logger,
        adminBankingTedRepository,
      );

    this.confirmAdminBankingTedController =
      new ConfirmAdminBankingTedController(
        logger,
        adminBankingTedRepository,
        bankingAccountRepository,
        adminBankingTedEmitter,
      );
  }

  async execute(request: ConfirmTedRequest): Promise<ConfirmTedResponse> {
    const { transactionId } = request;

    // Get banking ted by transactionId.
    const bankingTedFound =
      await this.getBankingTedByTransactionIdController.execute({
        transactionId,
      });

    // Check if banking ted exists.
    if (bankingTedFound) {
      // Call bankingTed controller
      const bankingTed = await this.confirmBankingTed.execute(request);

      this.logger.info('BankingTed confirmed.', { bankingTed });

      return {
        id: bankingTed.id.toString(),
        createdAt: bankingTed.createdAt,
      };
    }

    // Get admin banking ted by transactionId.
    const adminBankingTedFound =
      await this.getAdminBankingTedByTransactionIdController.execute({
        transactionId,
      });

    // Check if admin banking ted exists.
    if (adminBankingTedFound) {
      // Call admin bankingTed controller.
      const adminBankingTed =
        await this.confirmAdminBankingTedController.execute({
          ...request,
          value: request.amount,
        });

      this.logger.info('BankingTed completed.', { adminBankingTed });

      return {
        id: adminBankingTed.id,
        createdAt: adminBankingTed.createdAt,
      };
    }

    if (!bankingTedFound && !adminBankingTedFound) {
      throw new BankingTedNotFoundException({
        transactionId: request.transactionId,
      });
    }
  }
}
