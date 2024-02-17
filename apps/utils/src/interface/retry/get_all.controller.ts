import { AutoValidator, IsDateAfterThan } from '@zro/common';
import { Retry, RetryRepository } from '@zro/utils/domain';
import { IsDate, IsDefined, IsInt, IsString, IsUUID } from 'class-validator';
import { Logger } from 'winston';
import { GetAllRetryUseCase as UseCase } from '@zro/utils/application';

type TGetAllRetryResponse = Retry;

export class GetAllRetryResponse
  extends AutoValidator
  implements TGetAllRetryResponse
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

  constructor(props: TGetAllRetryResponse) {
    super(props);
  }
}

export class GetAllRetryController {
  private usecase: UseCase;
  constructor(
    private logger: Logger,
    private retryRepository: RetryRepository,
  ) {
    this.logger = logger.child({ context: GetAllRetryController.name });
    this.usecase = new UseCase(this.logger, this.retryRepository);
  }

  async execute(limit: number = null): Promise<GetAllRetryResponse[]> {
    this.logger.debug('Getting all a retry.');
    const result = await this.usecase.execute(limit, 0);

    return result.map(
      (r) =>
        new GetAllRetryResponse({
          id: r.id,
          counter: r.counter,
          retryQueue: r.retryQueue,
          failQueue: r.failQueue,
          retryAt: r.retryAt,
          abortAt: r.abortAt,
          data: r.data,
        }),
    );
  }
}
