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
  ValidateIf,
} from 'class-validator';
import {
  AutoValidator,
  IsDateAfterThanNow,
  IsIsoStringDateFormat,
  MaxValue,
  SanitizeHtml,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { PixKey, PixKeyEntity } from '@zro/pix-keys/domain';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  CreateQrCodeStaticUseCase as UseCase,
  PixKeyService,
  UserService,
} from '@zro/pix-payments/application';
import {
  QrCodeStaticEventEmitterController,
  QrCodeStaticEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];
type PixKeyId = PixKey['id'];

type TCreateQrCodeStaticRequest = Pick<
  QrCodeStatic,
  | 'id'
  | 'documentValue'
  | 'summary'
  | 'description'
  | 'ispbWithdrawal'
  | 'expirationDate'
> & {
  userId: UserId;
  keyId?: PixKeyId;
  key?: PixKey['key'];
  payableManyTimes?: QrCodeStatic['payableManyTimes'];
};

export class CreateQrCodeStaticRequest
  extends AutoValidator
  implements TCreateQrCodeStaticRequest
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  userId!: UserId;

  @ValidateIf((obj: TCreateQrCodeStaticRequest) => !obj.key)
  @IsUUID(4)
  keyId?: PixKeyId;

  @ValidateIf((obj: TCreateQrCodeStaticRequest) => !obj.keyId)
  @IsString()
  @MaxLength(77)
  key?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @MaxValue(1e18)
  documentValue?: number;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(255)
  summary?: string;

  @IsOptional()
  @IsString()
  @SanitizeHtml()
  @MaxLength(64)
  description?: string;

  @IsOptional()
  @IsString()
  ispbWithdrawal?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  @IsDateAfterThanNow('YYYY-MM-DDTHH:mm:ss.SSSZ', false)
  expirationDate?: Date;

  @IsOptional()
  @IsBoolean()
  payableManyTimes?: boolean;

  constructor(props: TCreateQrCodeStaticRequest) {
    super(props);
  }
}

type TCreateQrCodeStaticResponse = Pick<
  QrCodeStatic,
  | 'id'
  | 'txId'
  | 'emv'
  | 'documentValue'
  | 'summary'
  | 'description'
  | 'state'
  | 'ispbWithdrawal'
  | 'expirationDate'
  | 'payableManyTimes'
  | 'createdAt'
> & { keyId: PixKeyId };

export class CreateQrCodeStaticResponse
  extends AutoValidator
  implements TCreateQrCodeStaticResponse
{
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  keyId!: PixKeyId;

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

  @IsEnum(QrCodeStaticState)
  state: QrCodeStaticState;

  @IsOptional()
  @IsString()
  ispbWithdrawal?: string;

  @IsOptional()
  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  expirationDate?: Date;

  @IsBoolean()
  payableManyTimes: boolean;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TCreateQrCodeStaticResponse) {
    super(props);
  }
}

export class CreateQrCodeStaticController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    qrCodeStaticRepository: QrCodeStaticRepository,
    userService: UserService,
    pixKeyService: PixKeyService,
    eventEmitter: QrCodeStaticEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: CreateQrCodeStaticController.name });

    const controllerEventEmitter = new QrCodeStaticEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      qrCodeStaticRepository,
      userService,
      pixKeyService,
      controllerEventEmitter,
    );
  }

  async execute(
    request: CreateQrCodeStaticRequest,
  ): Promise<CreateQrCodeStaticResponse> {
    this.logger.debug('Create qrCodeStatic request.', { request });

    const {
      id,
      userId,
      keyId,
      key,
      documentValue,
      description,
      summary,
      ispbWithdrawal,
      expirationDate,
      payableManyTimes,
    } = request;

    const user = new UserEntity({ uuid: userId });
    const pixKey = new PixKeyEntity({ id: keyId, key });

    const qrCodeStatic = await this.usecase.execute(
      id,
      user,
      pixKey,
      documentValue,
      summary,
      description,
      ispbWithdrawal,
      expirationDate,
      payableManyTimes,
    );

    if (!qrCodeStatic) return null;

    const response = new CreateQrCodeStaticResponse({
      id: qrCodeStatic.id,
      txId: qrCodeStatic.txId,
      emv: qrCodeStatic.emv,
      keyId: qrCodeStatic.pixKey.id,
      documentValue: qrCodeStatic.documentValue,
      description: qrCodeStatic.description,
      summary: qrCodeStatic.summary,
      state: qrCodeStatic.state,
      ispbWithdrawal: qrCodeStatic.ispbWithdrawal,
      expirationDate: qrCodeStatic.expirationDate,
      payableManyTimes: qrCodeStatic.payableManyTimes,
      createdAt: qrCodeStatic.createdAt,
    });

    this.logger.info('Create qrCodeStatic response.', {
      qrCodeStatic: response,
    });

    return response;
  }
}
