import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRefundOperationEntity,
  PixInfractionRefundOperationState,
  PixInfractionRefundOperationRepository,
  PixDepositState,
  TGetPixInfractionRefundOperationFilter,
  PixInfractionRefundOperation,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import {
  CurrencyEntity,
  Operation,
  OperationEntity,
  Wallet,
} from '@zro/operations/domain';
import { OperationService } from '@zro/pix-payments/application';
import { OperationNotFoundException } from '@zro/operations/application';
import { User } from '@zro/users/domain';

export class HandleCreatePixInfractionRefundOperationUseCase {
  private sumByOriginalOperationId: Record<
    string,
    [number, number, PixInfractionRefundOperation]
  > = {};
  private createdRefundOperations: Operation[] = [];

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixInfractionRefundOperationRepository Pix infraction refund operation repository.
   * @param operationService Operation service.
   * @param pixPaymentOperationCurrencyTag Refund operation currency tag.
   * @param pixPaymentOperationRefundTransactionTag Refund operation transaction type tag.
   */
  constructor(
    private logger: Logger,
    private readonly pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    private readonly operationService: OperationService,
    private readonly pixPaymentOperationCurrencyTag: string,
    private readonly pixPaymentOperationRefundTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandleCreatePixInfractionRefundOperationUseCase.name,
    });
  }

  /**
   * A new pix transaction has been received successfully.
   * Check if the user has any pending pix infraction refund operation and analyze if new transaction should be blocked or not.
   *
   * @param refundOperationId Refund Operation ID.
   * @param transactionId Pix transaction ID.
   * @param state Pix transaction state.
   * @param user Pix transaction user.
   * @param wallet Pix transaction wallet.
   * @param amount Pix transaction amount.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    refundOperationId: string,
    transactionId: string,
    state: PixDepositState | PixDevolutionReceivedState,
    user: User,
    wallet: Wallet,
    amount: number,
  ): Promise<PixInfraction> {
    // Data input check
    if (
      !refundOperationId ||
      !transactionId ||
      !state ||
      !user?.uuid ||
      !wallet?.uuid ||
      !amount
    ) {
      throw new MissingDataException([
        ...(!refundOperationId ? ['Refund Operation ID'] : []),
        ...(!transactionId ? ['Pix Transaction ID'] : []),
        ...(!state ? ['Pix transaction State'] : []),
        ...(!user?.uuid ? ['Pix transaction User ID'] : []),
        ...(!wallet?.uuid ? ['Pix transaction Wallet ID'] : []),
        ...(!amount ? ['Pix transaction Amount'] : []),
      ]);
    }

    // Check if user has any open pix infraction refund operation.
    const filter: TGetPixInfractionRefundOperationFilter = {
      user: user,
      states: [PixInfractionRefundOperationState.OPEN],
    };

    const pixInfractionRefundOperations =
      await this.pixInfractionRefundOperationRepository.getAllByFilter(filter);

    this.logger.debug('Pix infraction refund operations found.', {
      pixInfractionRefundOperations,
    });

    // There is no need to block new users' balance.
    if (!pixInfractionRefundOperations?.length) return;

    // Idempotence.
    const refundOperationFound =
      await this.operationService.getOperationById(refundOperationId);

    this.logger.debug('Found refund operation.', {
      operation: refundOperationFound,
    });

    if (refundOperationFound) return;

    for (const pixInfractionRefundOperation of pixInfractionRefundOperations) {
      const { id: originalOperationId, value: originalOperationValue } =
        pixInfractionRefundOperation.originalOperation;
      const { value: refundOperationValue } =
        pixInfractionRefundOperation.refundOperation;

      // Check if the originalOperationId is already in the dictionary
      if (this.sumByOriginalOperationId.hasOwnProperty(originalOperationId)) {
        // If it is, add the refund value to the existing sum of refund values.
        this.sumByOriginalOperationId[originalOperationId][1] +=
          refundOperationValue;
      } else {
        // If it's not, initialize it.
        this.sumByOriginalOperationId[originalOperationId] = [
          originalOperationValue,
          refundOperationValue,
          pixInfractionRefundOperation,
        ];
      }
    }

    // Analyze if user has any pending balance that should be blocked.
    for (const originalOperationId in this.sumByOriginalOperationId) {
      const originalOperationValue =
        this.sumByOriginalOperationId[originalOperationId][0];
      const sumRefundOperationValues =
        this.sumByOriginalOperationId[originalOperationId][1];
      const pixInfractionRefundOperation =
        this.sumByOriginalOperationId[originalOperationId][2];

      this.logger.debug(
        'Pix infraction refund operation additional information.',
        {
          originalOperationId,
          originalOperationValue,
          sumRefundOperationValues,
        },
      );

      if (originalOperationValue > sumRefundOperationValues) {
        const blockValue = Math.min(
          originalOperationValue - sumRefundOperationValues,
          amount,
        );

        try {
          await this.blockWalletAccountBalance(
            refundOperationId,
            blockValue,
            pixInfractionRefundOperation,
            wallet,
          );
        } catch (error) {
          await this.revertCreatedRefundOperations();

          throw error;
        }
      }
    }
  }

  private async revertCreatedRefundOperations(): Promise<void> {
    if (!this.createdRefundOperations.length) return;

    for (const operation of this.createdRefundOperations) {
      await this.operationService.revertOperation(operation);

      this.logger.debug('Reverted refund operation due to error.', {
        operation,
      });
    }
  }

  private async blockWalletAccountBalance(
    refundOperationId: string,
    blockValue: Operation['value'],
    pixInfractionRefundOperation: PixInfractionRefundOperation,
    wallet: Wallet,
  ): Promise<void> {
    this.logger.debug('Block user wallet balance.', {
      value: blockValue,
      user: pixInfractionRefundOperation.user,
    });

    const originalOperation = await this.operationService.getOperationById(
      pixInfractionRefundOperation.originalOperation.id,
    );

    this.logger.debug('Original operation found.', { originalOperation });

    if (!originalOperation) {
      throw new OperationNotFoundException(
        pixInfractionRefundOperation.originalOperation.id,
      );
    }

    const newOperation = new OperationEntity({
      id: refundOperationId,
      rawValue: blockValue,
      currency: new CurrencyEntity({
        tag: this.pixPaymentOperationCurrencyTag,
      }),
      description: this.pixPaymentOperationRefundTransactionTag,
    });
    const ownerAllowAvailableRawValue = true;

    const createOperationResponse = await this.operationService.createOperation(
      this.pixPaymentOperationRefundTransactionTag,
      newOperation,
      wallet,
      null,
      ownerAllowAvailableRawValue,
    );

    this.logger.debug('Created new operation to block wallet balance.', {
      createOperationResponse,
    });

    this.createdRefundOperations.push(newOperation);

    const refundOperation = new OperationEntity({
      id: createOperationResponse?.owner?.id,
      value: createOperationResponse?.owner?.value,
    });

    const newPixInfractionRefundOperation =
      new PixInfractionRefundOperationEntity({
        id: uuidV4(),
        state: PixInfractionRefundOperationState.OPEN,
        user: pixInfractionRefundOperation.user,
        pixInfraction: pixInfractionRefundOperation.pixInfraction,
        pixRefund: pixInfractionRefundOperation.pixRefund,
        originalOperation,
        refundOperation,
      });

    await this.pixInfractionRefundOperationRepository.create(
      newPixInfractionRefundOperation,
    );

    this.logger.debug('Created new pix infraction refund operation.', {
      pixInfractionRefundOperation: newPixInfractionRefundOperation,
    });
  }
}
