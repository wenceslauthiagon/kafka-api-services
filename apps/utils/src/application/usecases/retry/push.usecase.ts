import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Retry, RetryRepository } from '@zro/utils/domain';

export class PushRetryUseCase {
  constructor(
    private logger: Logger,
    private readonly retryRepository: RetryRepository,
  ) {
    this.logger = logger.child({ context: PushRetryUseCase.name });
  }

  async execute(retry: Retry): Promise<Retry> {
    if (!retry) {
      throw new MissingDataException(['retry']);
    }

    const foundRetry = await this.retryRepository.getById(retry.id);

    if (foundRetry) {
      return foundRetry;
    }

    this.logger.debug('Pushing a retry.', { retry });
    return this.retryRepository.create(retry);
  }
}
