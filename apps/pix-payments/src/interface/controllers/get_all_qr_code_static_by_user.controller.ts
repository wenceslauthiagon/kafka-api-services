import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  Pagination,
  PaginationResponse,
  PaginationEntity,
  PaginationRequest,
  IsIsoStringDateFormat,
  AutoValidator,
  Sort,
  PaginationSort,
} from '@zro/common';
import { PixKey } from '@zro/pix-keys/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import { GetAllQrCodeStaticUseCase as UseCase } from '@zro/pix-payments/application';

export enum GetAllQrCodeStaticByUserRequestSort {
  CREATED_AT = 'created_at',
}

type UserId = User['uuid'];
type PixKeyId = PixKey['id'];

type TGetAllQrCodeStaticByUserRequest = Pagination & {
  userId: UserId;
};

export class GetAllQrCodeStaticByUserRequest
  extends PaginationRequest
  implements TGetAllQrCodeStaticByUserRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @Sort(GetAllQrCodeStaticByUserRequestSort)
  sort?: PaginationSort;

  constructor(props: TGetAllQrCodeStaticByUserRequest) {
    super(props);
  }
}

type TGetAllQrCodeStaticByUserResponseItem = Pick<
  QrCodeStatic,
  | 'id'
  | 'emv'
  | 'documentValue'
  | 'summary'
  | 'description'
  | 'expirationDate'
  | 'payableManyTimes'
  | 'state'
  | 'createdAt'
> & { keyId: PixKeyId; txId?: QrCodeStatic['txId'] };

export class GetAllQrCodeStaticByUserResponseItem
  extends AutoValidator
  implements TGetAllQrCodeStaticByUserResponseItem
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  keyId: PixKeyId;

  @IsString()
  @MaxLength(25)
  txId: string;

  @IsString()
  @IsOptional()
  emv?: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  documentValue?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  description?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  expirationDate?: Date;

  @IsBoolean()
  payableManyTimes: boolean;

  @IsEnum(QrCodeStaticState)
  state: QrCodeStaticState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetAllQrCodeStaticByUserResponseItem) {
    super(props);
  }
}

export class GetAllQrCodeStaticByUserResponse extends PaginationResponse<GetAllQrCodeStaticByUserResponseItem> {}

export class GetAllQrCodeStaticByUserController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    qrCodeStaticRepository: QrCodeStaticRepository,
  ) {
    this.logger = logger.child({
      context: GetAllQrCodeStaticByUserController.name,
    });
    this.usecase = new UseCase(this.logger, qrCodeStaticRepository);
  }

  async execute(
    request: GetAllQrCodeStaticByUserRequest,
  ): Promise<GetAllQrCodeStaticByUserResponse> {
    this.logger.debug('GetAll QrCodeStatics by user request.', { request });

    const { userId, order, page, pageSize, sort } = request;

    const user = new UserEntity({ uuid: userId });
    const pagination = new PaginationEntity({ order, page, pageSize, sort });

    const qrCodeStatics = await this.usecase.execute(user, pagination);

    const data = qrCodeStatics.data.map(
      (qrCodeStatic) =>
        new GetAllQrCodeStaticByUserResponseItem({
          id: qrCodeStatic.id,
          txId: qrCodeStatic.txId,
          emv: qrCodeStatic.emv,
          keyId: qrCodeStatic.pixKey.id,
          documentValue: qrCodeStatic.documentValue,
          summary: qrCodeStatic.summary,
          description: qrCodeStatic.description,
          expirationDate: qrCodeStatic.expirationDate,
          payableManyTimes: qrCodeStatic.payableManyTimes,
          state: qrCodeStatic.state,
          createdAt: qrCodeStatic.createdAt,
        }),
    );

    const response = new GetAllQrCodeStaticByUserResponse({
      ...qrCodeStatics,
      data,
    });

    this.logger.info('GetAll QrCodeStatics by user response.', {
      qrCodeStatics: response,
    });

    return response;
  }
}
