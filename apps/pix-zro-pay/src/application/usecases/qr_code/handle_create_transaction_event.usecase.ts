import { Logger } from 'winston';
import { MissingDataException, formatValueFromFloatToInt } from '@zro/common';
import {
  PlanRepository,
  QrCode,
  Transaction,
  TransactionEntity,
  TransactionPaymentType,
  TransactionProcessStatus,
  TransactionRepository,
  TransactionStatus,
  TransactionType,
} from '@zro/pix-zro-pay/domain';
import { PlanNotFoundException } from '@zro/pix-zro-pay/application';

export class HandleCreateTransactionQrCodeEventUseCase {
  constructor(
    private logger: Logger,
    private readonly transactionRepository: TransactionRepository,
    private readonly planRepository: PlanRepository,
  ) {
    this.logger = logger.child({
      context: HandleCreateTransactionQrCodeEventUseCase.name,
    });
  }

  async execute(qrCode: QrCode): Promise<Transaction> {
    const {
      value,
      bankAccount,
      client,
      company,
      description,
      transactionUuid,
      merchantId,
      txId,
    } = qrCode;

    // Data input check
    if (!transactionUuid || !company) {
      throw new MissingDataException([
        ...(!transactionUuid ? ['Transaction UUID'] : []),
        ...(!company ? ['Company'] : []),
      ]);
    }

    const transactionFound =
      await this.transactionRepository.getByUuid(transactionUuid);

    this.logger.debug('Transaction Found.', { transaction: transactionFound });

    if (transactionFound) {
      return transactionFound;
    }

    const planFound = await this.planRepository.getById(company.plan?.id);

    this.logger.debug('Plan found', { plan: planFound });

    if (!planFound) {
      throw new PlanNotFoundException(planFound);
    }

    const { feeCashinInPercent, feeCashinInCents } = planFound;

    const totalFee =
      feeCashinInCents + Number(value * (feeCashinInPercent / 100));

    const feeValueByPercent = Number(value * (feeCashinInPercent / 100));

    const mainCompanyTotalFeeCents = formatValueFromFloatToInt(
      value - feeValueByPercent - feeCashinInCents,
      0,
    );

    const zroTotalValueInCents = formatValueFromFloatToInt(
      feeValueByPercent + feeCashinInCents,
      0,
    );

    const newTransaction = new TransactionEntity({
      paymentType: TransactionPaymentType.PIX,
      valueCents: value,
      feeValue: feeCashinInCents,
      feeInPercent: feeCashinInPercent,
      totalFee,
      client,
      status: TransactionStatus.PENDING,
      bankAccount,
      company,
      pixKey: bankAccount.pixKey,
      pixKeyType: bankAccount.pixKeyType,
      description,
      transactionType: TransactionType.TRANSACTION,
      referenceId: txId,
      uuid: transactionUuid,
      merchantId,
      zroTotalValueInCents,
      mainCompanyTotalFeeCents,
      processStatus: TransactionProcessStatus.WAITING,
    });

    await this.transactionRepository.create(newTransaction);

    return newTransaction;
  }
}
