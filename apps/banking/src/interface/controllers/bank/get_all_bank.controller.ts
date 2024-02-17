import { Logger } from 'winston';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  Pagination,
  PaginationEntity,
  PaginationRequest,
  AutoValidator,
  PaginationResponse,
  IsIsoStringDateFormat,
  Sort,
  PaginationSort,
} from '@zro/common';
import { Bank, BankRepository } from '@zro/banking/domain';
import { GetAllBankUseCase as UseCase } from '@zro/banking/application';

export enum GetAllBankRequestSort {
  ID = 'id',
  ISPB = 'ispb',
  NAME = 'name',
  ACTIVE = 'active',
  CREATED_AT = 'created_at',
}

type TGetAllBankRequest = Pagination & {
  search?: string;
  active?: boolean;
};

export class GetAllBankRequest
  extends PaginationRequest
  implements TGetAllBankRequest
{
  @IsOptional()
  @Sort(GetAllBankRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  search?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  constructor(props: TGetAllBankRequest) {
    super(props);
  }
}

type TGetAllBankResponseItem = Pick<
  Bank,
  'id' | 'ispb' | 'name' | 'fullName' | 'active' | 'createdAt'
>;

export class GetAllBankResponseItem
  extends AutoValidator
  implements TGetAllBankResponseItem
{
  @IsUUID(4)
  id: string;

  @IsString()
  @Length(8, 8)
  ispb: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(255)
  fullName: string;

  @IsBoolean()
  active: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllBankResponseItem) {
    super(props);
  }
}

export class GetAllBankResponse extends PaginationResponse<GetAllBankResponseItem> {}

export class GetAllBankController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankRepository: BankRepository,
  ) {
    this.logger = logger.child({ context: GetAllBankController.name });
    this.usecase = new UseCase(this.logger, bankRepository);
  }

  async execute(request: GetAllBankRequest): Promise<GetAllBankResponse> {
    this.logger.debug('Get all filtered banks request.', { request });

    const { order, page, pageSize, sort, search, active } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const banks = await this.usecase.execute(pagination, search, active);

    if (!banks) return null;

    const data = banks.data.map(
      (bank) =>
        new GetAllBankResponseItem({
          id: bank.id,
          ispb: bank.ispb,
          name: bank.name,
          fullName: bank.fullName,
          active: bank.active,
          createdAt: bank.createdAt,
        }),
    );

    const response = new GetAllBankResponse({ ...banks, data });

    this.logger.debug('Get all filtered banks response.', { banks: response });

    return response;
  }
}
