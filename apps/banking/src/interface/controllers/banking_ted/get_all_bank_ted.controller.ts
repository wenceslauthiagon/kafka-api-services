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
import { BankTed, BankTedRepository } from '@zro/banking/domain';
import { GetAllBankTedUseCase as UseCase } from '@zro/banking/application';

export enum GetAllBankTedRequestSort {
  ID = 'id',
  CODE = 'code',
  ISPB = 'ispb',
  NAME = 'name',
  ACTIVE = 'active',
  CREATED_AT = 'created_at',
}

type TGetAllBankTedRequest = Pagination & {
  search?: string;
  active?: boolean;
};

export class GetAllBankTedRequest
  extends PaginationRequest
  implements TGetAllBankTedRequest
{
  @IsOptional()
  @Sort(GetAllBankTedRequestSort)
  sort?: PaginationSort;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  search?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  constructor(props: TGetAllBankTedRequest) {
    super(props);
  }
}

type TGetAllBankTedResponseItem = Pick<
  BankTed,
  'id' | 'code' | 'ispb' | 'name' | 'fullName' | 'active' | 'createdAt'
>;

export class GetAllBankTedResponseItem
  extends AutoValidator
  implements TGetAllBankTedResponseItem
{
  @IsUUID(4)
  id: string;

  @IsString()
  @MaxLength(255)
  code: string;

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

  constructor(props: TGetAllBankTedResponseItem) {
    super(props);
  }
}

export class GetAllBankTedResponse extends PaginationResponse<GetAllBankTedResponseItem> {}

export class GetAllBankTedController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    bankTedRepository: BankTedRepository,
  ) {
    this.logger = logger.child({ context: GetAllBankTedController.name });
    this.usecase = new UseCase(this.logger, bankTedRepository);
  }

  async execute(request: GetAllBankTedRequest): Promise<GetAllBankTedResponse> {
    this.logger.debug('Get all filtered banksTed request.', { request });

    const { order, page, pageSize, sort, search, active } = request;

    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const banksTed = await this.usecase.execute(pagination, search, active);

    if (!banksTed) return null;

    const data = banksTed.data.map(
      (bankTed) =>
        new GetAllBankTedResponseItem({
          id: bankTed.id,
          code: bankTed.code,
          ispb: bankTed.ispb,
          name: bankTed.name,
          fullName: bankTed.fullName,
          active: bankTed.active,
          createdAt: bankTed.createdAt,
        }),
    );

    const response = new GetAllBankTedResponse({ ...banksTed, data });

    this.logger.info('Get all filtered banksTed response.', {
      banksTed: response,
    });

    return response;
  }
}
