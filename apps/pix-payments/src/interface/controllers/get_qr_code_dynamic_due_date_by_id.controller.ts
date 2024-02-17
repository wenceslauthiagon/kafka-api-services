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
import {
  PixPaymentGateway,
  GetQrCodeDynamicDueDateByIdUseCase as UseCase,
} from '@zro/pix-payments/application';

type UserId = User['uuid'];
type PixKeyId = PixKey['id'];

type TGetQrCodeDynamicDueDateByIdRequest = Pick<QrCodeDynamic, 'id'> & {
  userId?: UserId;
};

export class GetQrCodeDynamicDueDateByIdRequest
  extends AutoValidator
  implements TGetQrCodeDynamicDueDateByIdRequest
{
  @IsUUID(4)
  id: string;

  @IsOptional()
  @IsUUID(4)
  userId?: UserId;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DD', {
    message: 'Invalid format paymentDate',
  })
  paymentDate?: Date;

  @IsOptional()
  @IsString()
  cityCode?: string;

  constructor(props: TGetQrCodeDynamicDueDateByIdRequest) {
    super(props);
  }
}

type TGetQrCodeDynamicDueDateByIdResponse = Pick<
  QrCodeDynamic,
  | 'id'
  | 'emv'
  | 'expirationDate'
  | 'dueDate'
  | 'documentValue'
  | 'description'
  | 'state'
  | 'createdAt'
  | 'payloadJws'
> & { keyId: PixKeyId; txId?: QrCodeDynamic['txId'] };

export class GetQrCodeDynamicDueDateByIdResponse
  extends AutoValidator
  implements TGetQrCodeDynamicDueDateByIdResponse
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

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format dueDate',
  })
  @IsOptional()
  dueDate?: Date;

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

  constructor(props: TGetQrCodeDynamicDueDateByIdResponse) {
    super(props);
  }
}

export class GetQrCodeDynamicDueDateByIdController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    qrCodeDynamicRepository: QrCodeDynamicRepository,
    pspGateway: PixPaymentGateway,
  ) {
    this.logger = logger.child({
      context: GetQrCodeDynamicDueDateByIdController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      qrCodeDynamicRepository,
      pspGateway,
    );
  }

  async execute(
    request: GetQrCodeDynamicDueDateByIdRequest,
  ): Promise<GetQrCodeDynamicDueDateByIdResponse> {
    this.logger.debug('Get QrCodeDynamic Due Date by Id request.', { request });

    const { id, userId } = request;

    const user = userId && new UserEntity({ uuid: userId });

    const qrCodeDynamic = await this.usecase.execute(id, user);

    if (!qrCodeDynamic) return null;

    const response = new GetQrCodeDynamicDueDateByIdResponse({
      id: qrCodeDynamic.id,
      txId: qrCodeDynamic.txId,
      emv: qrCodeDynamic.emv,
      keyId: qrCodeDynamic.pixKey.id,
      expirationDate: qrCodeDynamic.expirationDate,
      dueDate: qrCodeDynamic.dueDate,
      documentValue: qrCodeDynamic.documentValue,
      description: qrCodeDynamic.description,
      state: qrCodeDynamic.state,
      createdAt: qrCodeDynamic.createdAt,
      payloadJws: qrCodeDynamic.payloadJws,
    });

    this.logger.info('Get QrCodeDynamic Due Date by Id response.', {
      qrCodeDynamic: response,
    });

    return response;
  }
}
