import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import { GetTransactionUseCase as UseCase } from '@zro/payments-gateway/application';
import {
  TransactionCurrentPageRepository,
  TransactionRepository,
} from '@zro/payments-gateway/domain';

export class GetTransactionController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    transactionRepository: TransactionRepository,
    transactionCurrentPageRepository: TransactionCurrentPageRepository,
    axiosInstance: AxiosInstance,
  ) {
    this.logger = logger.child({ context: GetTransactionController.name });

    this.usecase = new UseCase(
      this.logger,
      transactionRepository,
      transactionCurrentPageRepository,
      axiosInstance,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Get transactions request.');

    await this.usecase.execute();

    this.logger.info('Finish get transactions.');
  }
}
