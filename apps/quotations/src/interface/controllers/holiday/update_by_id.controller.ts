import { Logger } from 'winston';
import { IsEnum, IsUUID, IsString } from 'class-validator';
import { IsIsoStringDateFormat, AutoValidator } from '@zro/common';
import {
  Holiday,
  HolidayLevel,
  HolidayRepository,
  HolidayType,
} from '@zro/quotations/domain';
import { UpdateHolidayByIdUseCase as UseCase } from '@zro/quotations/application';

type TUpdateHolidayByIdRequest = Pick<Holiday, 'id' | 'startDate' | 'endDate'>;

export class UpdateHolidayByIdRequest
  extends AutoValidator
  implements TUpdateHolidayByIdRequest
{
  @IsUUID(4)
  id: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format startDate',
  })
  startDate: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format endDate',
  })
  endDate: Date;

  constructor(props: TUpdateHolidayByIdRequest) {
    super(props);
  }
}

type TUpdateHolidayByIdResponse = Pick<
  Holiday,
  | 'id'
  | 'startDate'
  | 'endDate'
  | 'name'
  | 'type'
  | 'level'
  | 'createdAt'
  | 'updatedAt'
>;

export class UpdateHolidayByIdResponse
  extends AutoValidator
  implements TUpdateHolidayByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format startDate',
  })
  startDate: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss', {
    message: 'Invalid format endDate',
  })
  endDate: Date;

  @IsString()
  name: string;

  @IsEnum(HolidayType)
  type: HolidayType;

  @IsEnum(HolidayLevel)
  level: HolidayLevel;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format updatedAt',
  })
  updatedAt: Date;

  constructor(props: TUpdateHolidayByIdResponse) {
    super(props);
  }
}

export class UpdateHolidayByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    holidayRepository: HolidayRepository,
  ) {
    this.logger = logger.child({ context: UpdateHolidayByIdController.name });

    this.usecase = new UseCase(this.logger, holidayRepository);
  }

  async execute(
    request: UpdateHolidayByIdRequest,
  ): Promise<UpdateHolidayByIdResponse> {
    this.logger.debug('Update holiday by id request.', { request });

    const { id, startDate, endDate } = request;

    const result = await this.usecase.execute(id, startDate, endDate);

    if (!result) return null;

    const response = new UpdateHolidayByIdResponse({
      id: result.id,
      startDate: result.startDate,
      endDate: result.endDate,
      name: result.name,
      type: result.type,
      level: result.level,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });

    return response;
  }
}
