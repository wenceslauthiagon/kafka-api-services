import { Logger } from 'winston';
import {
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
  QrCodeDynamic,
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import { GetQrCodeDynamicByIdUseCase as UseCase } from '@zro/pix-payments/application';

type UserId = User['uuid'];
type PixKeyId = PixKey['id'];

type TGetQrCodeDynamicByIdRequest = Pick<QrCodeDynamic, 'id'> & {
  userId?: UserId;
};

export class GetQrCodeDynamicByIdRequest
  extends AutoValidator
  implements TGetQrCodeDynamicByIdRequest
{
  @IsOptional()
  @IsUUID(4)
  userId?: UserId;

  @IsUUID(4)
  id: string;

  constructor(props: TGetQrCodeDynamicByIdRequest) {
    super(props);
  }
}

type TGetQrCodeDynamicByIdResponse = Pick<
  QrCodeDynamic,
  | 'id'
  | 'emv'
  | 'expirationDate'
  | 'documentValue'
  | 'description'
  | 'state'
  | 'createdAt'
  | 'payloadJws'
> & { keyId: PixKeyId; txId?: QrCodeDynamic['txId'] };

export class GetQrCodeDynamicByIdResponse
  extends AutoValidator
  implements TGetQrCodeDynamicByIdResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  keyId: PixKeyId;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  txId?: string;

  @IsString()
  @IsOptional()
  emv?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  @IsOptional()
  expirationDate?: Date;

  @IsInt()
  @IsPositive()
  documentValue: number;

  @IsString()
  @MaxLength(140)
  description: string;

  @IsEnum(PixQrCodeDynamicState)
  state: PixQrCodeDynamicState;

  @IsOptional()
  @IsString()
  payloadJws?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetQrCodeDynamicByIdResponse) {
    super(props);
  }
}

export class GetQrCodeDynamicByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    qrCodeDynamicRepository: QrCodeDynamicRepository,
  ) {
    this.logger = logger.child({
      context: GetQrCodeDynamicByIdController.name,
    });
    this.usecase = new UseCase(this.logger, qrCodeDynamicRepository);
  }

  async execute(
    request: GetQrCodeDynamicByIdRequest,
  ): Promise<GetQrCodeDynamicByIdResponse> {
    this.logger.debug('GetById QrCodeDynamic request.', { request });

    const { userId, id } = request;

    const user = userId && new UserEntity({ uuid: userId });

    const qrCodeDynamic = await this.usecase.execute(id, user);

    if (!qrCodeDynamic) return null;

    const response = new GetQrCodeDynamicByIdResponse({
      id: qrCodeDynamic.id,
      txId: qrCodeDynamic.txId,
      emv: qrCodeDynamic.emv,
      keyId: qrCodeDynamic.pixKey.id,
      expirationDate: qrCodeDynamic.expirationDate,
      documentValue: qrCodeDynamic.documentValue,
      description: qrCodeDynamic.description,
      state: qrCodeDynamic.state,
      createdAt: qrCodeDynamic.createdAt,
      payloadJws: qrCodeDynamic.payloadJws,
    });

    this.logger.info('GetById QrCodeDynamic response.', {
      qrCodeDynamic: response,
    });

    return response;
  }
}
