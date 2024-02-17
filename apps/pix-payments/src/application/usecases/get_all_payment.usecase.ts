import { Logger } from 'winston';
import {
  Pagination,
  TPaginationResponse,
  MissingDataException,
} from '@zro/common';
import { User } from '@zro/users/domain';
import { Wallet } from '@zro/operations/domain';
import {
  Payment,
  PaymentRepository,
  PaymentState,
} from '@zro/pix-payments/domain';
import {
  BankingService,
  BankNotFoundException,
} from '@zro/pix-payments/application';

export class GetAllPaymentUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param paymentRepository Payment repository.
   * @param bankingService Banking service.
   * @param bankIspb Bank ispb.
   */
  constructor(
    private logger: Logger,
    private readonly paymentRepository: PaymentRepository,
    private readonly bankingService: BankingService,
    private readonly ownerBankIspb: string,
  ) {
    this.logger = logger.child({ context: GetAllPaymentUseCase.name });
  }

  /**
   * List all Payments.
   *
   * @returns Payments found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    pagination: Pagination,
    user?: User,
    wallet?: Wallet,
    states?: PaymentState[],
    paymentDatePeriodStart?: Date,
    paymentDatePeriodEnd?: Date,
    createdAtPeriodStart?: Date,
    createdAtPeriodEnd?: Date,
    endToEndId?: string,
    clientDocument?: string,
  ): Promise<
    TPaginationResponse<
      Payment & { ownerBankName?: string; ownerBankIspb?: string }
    >
  > {
    // Data input check
    if (!pagination) {
      throw new MissingDataException(['Pagination']);
    }

    // Search payments
    const paymentsPaginated = await this.paymentRepository.getAll(
      pagination,
      user,
      wallet,
      states,
      paymentDatePeriodStart,
      paymentDatePeriodEnd,
      createdAtPeriodStart,
      createdAtPeriodEnd,
      endToEndId,
      clientDocument,
    );

    this.logger.debug('Payments found.', { paymentsPaginated });

    if (!paymentsPaginated.total) {
      return paymentsPaginated;
    }

    // Get bank data if there are payments.
    const bank = await this.bankingService.getBankByIspb(this.ownerBankIspb);

    if (!bank) {
      throw new BankNotFoundException({ ispb: this.ownerBankIspb });
    }

    const paymentsWithOwnerBankInformation = paymentsPaginated.data.map(
      (payment) => ({
        ...payment,
        ownerBankName: bank.name,
        ownerBankIspb: bank.ispb,
      }),
    );

    const result = {
      ...paymentsPaginated,
      data: paymentsWithOwnerBankInformation,
    };

    return result;
  }
}
