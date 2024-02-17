import { MissingDataException } from '@zro/common';
import { Retry, RetryRepository } from '@zro/utils/domain';
import { Logger } from 'winston';

export class DeleteRetryUseCase {
  constructor(
    private logger: Logger,
    private readonly retryRepository: RetryRepository,
  ) {
    this.logger = logger.child({ context: DeleteRetryUseCase.name });
  }

  async execute(retry: Retry): Promise<void> {
    if (!retry) {
      throw new MissingDataException(['retry']);
    }

    const foundRetry = await this.retryRepository.getById(retry.id);

    if (foundRetry) {
      this.logger.debug('Deleting a retry.', { retry });
      return this.retryRepository.delete(foundRetry);
    }
  }
}
