import { AutoValidator, IsDateAfterThan } from '@zro/common';
import { Retry, RetryEntity, RetryRepository } from '@zro/utils/domain';
import { IsDate, IsDefined, IsInt, IsString, IsUUID } from 'class-validator';
import { Logger } from 'winston';
import { DeleteRetryUseCase as UseCase } from '@zro/utils/application';

type TDeleteRetryRequest = Retry;

export class DeleteRetryRequest
  extends AutoValidator
  implements TDeleteRetryRequest
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

  constructor(props: TDeleteRetryRequest) {
    super(props);
  }
}

export class DeleteRetryController {
  private usecase: UseCase;
  constructor(
    private logger: Logger,
    private retryRepository: RetryRepository,
  ) {
    this.logger = logger.child({ context: DeleteRetryController.name });
    this.usecase = new UseCase(this.logger, this.retryRepository);
  }

  async execute(request: TDeleteRetryRequest): Promise<void> {
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

    this.logger.debug('Deleteing a retry.', { retry });
    await this.usecase.execute(retry);
  }
}
