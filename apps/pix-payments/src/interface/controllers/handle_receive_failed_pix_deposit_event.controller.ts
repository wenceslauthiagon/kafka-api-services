import { Logger } from 'winston';
import { BankEntity } from '@zro/banking/domain';
import { PixDepositRepository } from '@zro/pix-payments/domain';
import {
  BankingService,
  UserService,
  HandleReceiveFailedPixDepositEventUseCase as UseCase,
} from '@zro/pix-payments/application';
import {
  PixDepositEventEmitterController,
  PixDevolutionEventEmitterController,
  PixDepositEventEmitterControllerInterface,
  PixDevolutionEventEmitterControllerInterface,
  ReceivePixDepositRequest,
} from '@zro/pix-payments/interface';

export class HandleReceiveFailedPixDepositEventController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    pixDepositRepository: PixDepositRepository,
    pixDepositEventEmitter: PixDepositEventEmitterControllerInterface,
    pixDevolutionEventEmitter: PixDevolutionEventEmitterControllerInterface,
    bankingService: BankingService,
    userService: UserService,
    pixPaymentOperationNewPixReceivedTransactionTag: string,
    pixPaymentZroBankIspb: string,
  ) {
    this.logger = logger.child({
      context: HandleReceiveFailedPixDepositEventController.name,
    });

    const pixDepositControllerEventEmitter =
      new PixDepositEventEmitterController(pixDepositEventEmitter);

    const pixDevolutionControllerEventEmitter =
      new PixDevolutionEventEmitterController(pixDevolutionEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixDepositRepository,
      pixDepositControllerEventEmitter,
      pixDevolutionControllerEventEmitter,
      bankingService,
      userService,
      pixPaymentOperationNewPixReceivedTransactionTag,
      pixPaymentZroBankIspb,
    );
  }

  async execute(request: ReceivePixDepositRequest): Promise<void> {
    this.logger.debug('Receive failed pix deposit request.', { request });

    const {
      id,
      amount,
      txId,
      endToEndId,
      clientBankIspb,
      clientBranch,
      clientAccountNumber,
      clientDocument,
      clientName,
      clientKey,
      thirdPartBankIspb,
      thirdPartBranch,
      thirdPartAccountType,
      thirdPartAccountNumber,
      thirdPartDocument,
      thirdPartName,
      thirdPartKey,
      description,
    } = request;

    const clientBank = new BankEntity({ ispb: clientBankIspb });
    const thirdPartBank = new BankEntity({ ispb: thirdPartBankIspb });

    await this.usecase.execute(
      id,
      amount,
      txId,
      endToEndId,
      clientBank,
      clientBranch,
      clientAccountNumber,
      clientDocument,
      clientName,
      clientKey,
      thirdPartBank,
      thirdPartBranch,
      thirdPartAccountType,
      thirdPartAccountNumber,
      thirdPartDocument,
      thirdPartName,
      thirdPartKey,
      description,
    );

    this.logger.info('Receive failed pix deposit response.');
  }
}
