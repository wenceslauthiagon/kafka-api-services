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
  HandlePendingFailedQrCodeDynamicEventUseCase as UseCase,
  QrCodeDynamicEvent,
} from '@zro/pix-payments/application';
import {
  QrCodeDynamicEventEmitterController,
  QrCodeDynamicEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

type UserId = User['uuid'];

type THandlePendingFailedQrCodeDynamicEventRequest = Pick<
  QrCodeDynamicEvent,
  'id' | 'state' | 'txId' | 'expirationDate'
> & { userId: UserId };

export class HandlePendingFailedQrCodeDynamicEventRequest
  extends AutoValidator
  implements THandlePendingFailedQrCodeDynamicEventRequest
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

  constructor(props: THandlePendingFailedQrCodeDynamicEventRequest) {
    super(props);
  }
}

type THandlePendingFailedQrCodeDynamicEventResponse = Pick<
  QrCodeDynamic,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingFailedQrCodeDynamicEventResponse
  extends AutoValidator
  implements THandlePendingFailedQrCodeDynamicEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(PixQrCodeDynamicState)
  state!: PixQrCodeDynamicState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandlePendingFailedQrCodeDynamicEventResponse) {
    super(props);
  }
}

export class HandlePendingFailedQrCodeDynamicEventController {
  /**
   * Handler triggered when an error is thrown.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param qrCodeDynamicRepository QrCodeDynamic repository.
   * @param eventEmitter QrCodeDynamic event emitter.
   */
  constructor(
    private logger: Logger,
    qrCodeDynamicRepository: QrCodeDynamicRepository,
    eventEmitter: QrCodeDynamicEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandlePendingFailedQrCodeDynamicEventController.name,
    });

    const controllerEventEmitter = new QrCodeDynamicEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      qrCodeDynamicRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandlePendingFailedQrCodeDynamicEventRequest,
  ): Promise<HandlePendingFailedQrCodeDynamicEventResponse> {
    const { id } = request;
    this.logger.debug('Handle pending failed event by ID request.', {
      request,
    });

    const qrCodeDynamic = await this.usecase.execute(id);

    if (!qrCodeDynamic) return null;

    const response = new HandlePendingFailedQrCodeDynamicEventResponse({
      id: qrCodeDynamic.id,
      state: qrCodeDynamic.state,
      createdAt: qrCodeDynamic.createdAt,
    });

    this.logger.info('Handle pending failed event by ID response.', {
      qrCodeDynamic: response,
    });

    return response;
  }
}
