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
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { PixKey } from '@zro/pix-keys/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import { GetByQrCodeStaticIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type PixKeyId = PixKey['id'];

type TGetByQrCodeStaticIdRequest = Pick<QrCodeStatic, 'id'> & {
  userId: UserId;
};

export class GetByQrCodeStaticIdRequest
  extends AutoValidator
  implements TGetByQrCodeStaticIdRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  id: string;

  constructor(props: TGetByQrCodeStaticIdRequest) {
    super(props);
  }
}

type TGetByQrCodeStaticIdResponse = Pick<
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

export class GetByQrCodeStaticIdResponse
  extends AutoValidator
  implements TGetByQrCodeStaticIdResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  keyId: PixKeyId;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  txId?: string;

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

  constructor(props: TGetByQrCodeStaticIdResponse) {
    super(props);
  }
}

export class GetByQrCodeStaticIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    qrCodeStaticRepository: QrCodeStaticRepository,
  ) {
    this.logger = logger.child({
      context: GetByQrCodeStaticIdController.name,
    });
    this.usecase = new UseCase(this.logger, qrCodeStaticRepository);
  }

  async execute(
    request: GetByQrCodeStaticIdRequest,
  ): Promise<GetByQrCodeStaticIdResponse> {
    this.logger.debug('GetById QrCodeStatic request.', { request });

    const { userId, id } = request;

    const user = new UserEntity({ uuid: userId });

    const qrCodeStatic = await this.usecase.execute(user, id);

    if (!qrCodeStatic) return null;

    const response = new GetByQrCodeStaticIdResponse({
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
    });

    this.logger.info('GetById QrCodeStatic response.', {
      qrCodeStatic: response,
    });

    return response;
  }
}
