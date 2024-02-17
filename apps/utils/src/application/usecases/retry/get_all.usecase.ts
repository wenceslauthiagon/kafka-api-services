import { Retry, RetryRepository } from '@zro/utils/domain';
import { Logger } from 'winston';

export class GetAllRetryUseCase {
  constructor(
    private logger: Logger,
    private readonly retryRepository: RetryRepository,
  ) {
    this.logger = logger.child({ context: GetAllRetryUseCase.name });
  }

  async execute(limit: number = null, offset: number = null): Promise<Retry[]> {
    this.logger.debug('Getting all retries queued.', { limit, offset });
    return this.retryRepository.getAll(limit, offset);
  }
}
