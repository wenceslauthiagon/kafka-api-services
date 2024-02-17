import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Operation, Wallet } from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  PixDevolutionReceivedRepository,
  PixDevolutionReceived,
  PaymentRepository,
} from '@zro/pix-payments/domain';
import { PaymentNotFoundException } from '@zro/pix-payments/application';

export class GetPixDevolutionReceivedByOperationIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param devolutionReceivedRepository PixDevolutionReceived repository.
   * @param paymentRepository Payment repository.
   */
  constructor(
    private logger: Logger,
    private readonly devolutionReceivedRepository: PixDevolutionReceivedRepository,
    private readonly paymentRepository: PaymentRepository,
  ) {
    this.logger = logger.child({
      context: GetPixDevolutionReceivedByOperationIdUseCase.name,
    });
  }

  /**
   * Get PixDevolutionReceived with PixDeposit by operation.
   *
   * @param operation PixDevolutionReceived operation.
   * @param wallet PixDevolutionReceived user.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @returns PixDevolutionReceived data.
   */
  async execute(
    operation: Operation,
    user?: User,
    wallet?: Wallet,
  ): Promise<PixDevolutionReceived> {
    // Data input check
    if (!operation?.id) {
      throw new MissingDataException(['Operation']);
    }

    // Get PixDevolutionReceived
    const devolution =
      await this.devolutionReceivedRepository.getByOperation(operation);

    this.logger.debug('PixDevolutionReceived found.', { devolution });

    if (
      !devolution ||
      (user && user?.uuid !== devolution.user.uuid) ||
      (wallet && wallet?.uuid !== devolution.wallet.uuid)
    ) {
      return null;
    }

    const payment = await this.paymentRepository.getById(devolution.payment.id);

    this.logger.debug('Payment found.', { payment });

    if (!payment) {
      throw new PaymentNotFoundException(devolution.payment);
    }

    devolution.payment = payment;

    return devolution;
  }
}
