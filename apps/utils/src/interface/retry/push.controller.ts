import { Logger } from 'winston';
import { IsDate, IsDefined, IsInt, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsDateAfterThan } from '@zro/common';
import { Retry, RetryEntity, RetryRepository } from '@zro/utils/domain';
import { PushRetryUseCase as UseCase } from '@zro/utils/application';

type TPushRetryRequest = Retry;

export class PushRetryRequest
  extends AutoValidator
  implements TPushRetryRequest
{
  @IsUUID(4)
  id: string;

  @IsInt()
  counter: number;

  @IsString()
  retryQueue: string;

  @IsString()
  failQueue: string;

  @IsDate()
  retryAt: Date;

  @IsDateAfterThan('retryAt', false)
  abortAt: Date;

  @IsDefined()
  data: unknown;

  constructor(props: TPushRetryRequest) {
    super(props);
  }
}

export class PushRetryController {
  private usecase: UseCase;
  constructor(
    private logger: Logger,
    private retryRepository: RetryRepository,
  ) {
    this.logger = logger.child({ context: PushRetryController.name });
    this.usecase = new UseCase(this.logger, this.retryRepository);
  }

  async execute(request: TPushRetryRequest): Promise<void> {
    const { id, counter, retryQueue, failQueue, retryAt, abortAt, data } =
      request;

    const retry = new RetryEntity({
      id,
      counter,
      retryQueue,
      failQueue,
      retryAt,
      abortAt,
      data,
    });

    this.logger.debug('Pushing a retry.', { retry });
    await this.usecase.execute(retry);
  }
}
