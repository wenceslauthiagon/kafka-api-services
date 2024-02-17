import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { IsIsoStringDateFormat, AutoValidator } from '@zro/common';
import {
  Holiday,
  HolidayLevel,
  HolidayRepository,
  HolidayType,
} from '@zro/quotations/domain';
import { GetHolidayByDateUseCase as UseCase } from '@zro/quotations/application';

export type TGetHolidayByDateRequest = { date: Date };

export class GetHolidayByDateRequest
  extends AutoValidator
  implements TGetHolidayByDateRequest
{
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  date: Date;

  constructor(props: TGetHolidayByDateRequest) {
    super(props);
  }
}

type TGetHolidayByDateResponse = Pick<
  Holiday,
  'id' | 'type' | 'level' | 'createdAt'
>;

export class GetHolidayByDateResponse
  extends AutoValidator
  implements TGetHolidayByDateResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(HolidayType)
  type: HolidayType;

  @IsEnum(HolidayLevel)
  level: HolidayLevel;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetHolidayByDateResponse) {
    super(props);
  }
}

export class GetHolidayByDateController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    conversionRepository: HolidayRepository,
  ) {
    this.logger = logger.child({ context: GetHolidayByDateController.name });

    this.usecase = new UseCase(this.logger, conversionRepository);
  }

  async execute(
    request: GetHolidayByDateRequest,
  ): Promise<GetHolidayByDateResponse> {
    this.logger.debug('Get holiday by date request.', { request });

    const { date } = request;

    const result = await this.usecase.execute(date);

    if (!result) return null;

    const response = new GetHolidayByDateResponse({
      id: result.id,
      type: result.type,
      level: result.level,
      createdAt: result.createdAt,
    });

    return response;
  }
}
