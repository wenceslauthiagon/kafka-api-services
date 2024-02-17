import { Logger } from 'winston';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { IsIsoStringDateFormat, AutoValidator } from '@zro/common';
import {
  Holiday,
  HolidayLevel,
  HolidayRepository,
  HolidayType,
} from '@zro/quotations/domain';
import { CreateHolidayUseCase as UseCase } from '@zro/quotations/application';

type TCreateHolidayRequest = Pick<
  Holiday,
  'id' | 'startDate' | 'endDate' | 'name' | 'level' | 'type'
>;

export class CreateHolidayRequest
  extends AutoValidator
  implements TCreateHolidayRequest
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

  @IsEnum(HolidayLevel)
  level: HolidayLevel;

  @IsEnum(HolidayType)
  type: HolidayType;

  constructor(props: TCreateHolidayRequest) {
    super(props);
  }
}

type TCreateHolidayResponse = Pick<Holiday, 'id' | 'createdAt'>;

export class CreateHolidayResponse
  extends AutoValidator
  implements TCreateHolidayResponse
{
  @IsUUID(4)
  id: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateHolidayResponse) {
    super(props);
  }
}

export class CreateHolidayController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    holidayRepository: HolidayRepository,
  ) {
    this.logger = logger.child({ context: CreateHolidayController.name });

    this.usecase = new UseCase(this.logger, holidayRepository);
  }

  async execute(request: CreateHolidayRequest): Promise<CreateHolidayResponse> {
    this.logger.debug('Create holiday request.', { request });

    const { id, startDate, endDate, name, level, type } = request;

    const result = await this.usecase.execute(
      id,
      startDate,
      endDate,
      name,
      level,
      type,
    );

    const response = new CreateHolidayResponse({
      id: result.id,
      createdAt: result.createdAt,
    });

    return response;
  }
}
