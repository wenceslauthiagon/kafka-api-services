import { Logger } from 'winston';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  QrCodeDynamic,
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import {
  HandlePendingQrCodeDynamicEventUseCase as UseCase,
  QrCodeDynamicEvent,
  PixPaymentGateway,
} from '@zro/pix-payments/application';
import {
  QrCodeDynamicEventEmitterController,
  QrCodeDynamicEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];

type THandlePendingQrCodeDynamicEventRequest = Pick<
  QrCodeDynamicEvent,
  'id' | 'state' | 'txId' | 'expirationDate'
> & { userId: UserId };

export class HandlePendingQrCodeDynamicEventRequest
  extends AutoValidator
  implements THandlePendingQrCodeDynamicEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(PixQrCodeDynamicState)
  state: PixQrCodeDynamicState;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  txId: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expirationDate',
  })
  @IsOptional()
  expirationDate?: Date;

  constructor(props: THandlePendingQrCodeDynamicEventRequest) {
    super(props);
  }
}

type THandlePendingQrCodeDynamicEventResponse = Pick<
  QrCodeDynamic,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingQrCodeDynamicEventResponse
  extends AutoValidator
  implements THandlePendingQrCodeDynamicEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixQrCodeDynamicState)
  state!: PixQrCodeDynamicState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandlePendingQrCodeDynamicEventResponse) {
    super(props);
  }
}

export class HandlePendingQrCodeDynamicEventController {
  /**
   * Handler triggered when QrCodeDynamic was added successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param qrCodeDynamicRepository QrCodeDynamic repository.
   * @param pixKeyService Pix key service gateway.
   * @param eventEmitter QrCodeDynamic event emitter.
   * @param pspGateway QrCodeDynamic psp gateway.
   */
  constructor(
    private logger: Logger,
    qrCodeDynamicRepository: QrCodeDynamicRepository,
    eventEmitter: QrCodeDynamicEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
  ) {
    this.logger = logger.child({
      context: HandlePendingQrCodeDynamicEventController.name,
    });

    const controllerEventEmitter = new QrCodeDynamicEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      qrCodeDynamicRepository,
      pspGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandlePendingQrCodeDynamicEventRequest,
  ): Promise<HandlePendingQrCodeDynamicEventResponse> {
    this.logger.debug('Handle pending event by ID request.', { request });

    const { id } = request;

    const qrCodeDynamic = await this.usecase.execute(id);

    if (!qrCodeDynamic) return null;

    const response = new HandlePendingQrCodeDynamicEventResponse({
      id: qrCodeDynamic.id,
      state: qrCodeDynamic.state,
      createdAt: qrCodeDynamic.createdAt,
    });

    this.logger.info('Handle deleting event by ID response.', {
      qrCodeDynamic: response,
    });

    return response;
  }
}
