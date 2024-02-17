import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  HandlePendingQrCodeStaticEventUseCase as UseCase,
  PixPaymentGateway,
} from '@zro/pix-payments/application';
import {
  QrCodeStaticControllerEvent,
  QrCodeStaticEventEmitterController,
  QrCodeStaticEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export class HandlePendingQrCodeStaticEventRequest extends QrCodeStaticControllerEvent {}

type THandlePendingQrCodeStaticEventResponse = Pick<
  QrCodeStatic,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingQrCodeStaticEventResponse
  extends AutoValidator
  implements THandlePendingQrCodeStaticEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(QrCodeStaticState)
  state!: QrCodeStaticState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandlePendingQrCodeStaticEventResponse) {
    super(props);
  }
}

export class HandlePendingQrCodeStaticEventController {
  /**
   * Handler triggered when QrCodeStatic was added successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param eventEmitter QrCodeStatic event emitter.
   * @param pspGateway QrCodeStatic psp gateway.
   */
  constructor(
    private logger: Logger,
    qrCodeStaticRepository: QrCodeStaticRepository,
    eventEmitter: QrCodeStaticEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
  ) {
    this.logger = logger.child({
      context: HandlePendingQrCodeStaticEventController.name,
    });

    const controllerEventEmitter = new QrCodeStaticEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      qrCodeStaticRepository,
      pspGateway,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandlePendingQrCodeStaticEventRequest,
  ): Promise<HandlePendingQrCodeStaticEventResponse> {
    this.logger.debug('Handle pending event by ID request.', { request });

    const { id } = request;

    const qrCodeStatic = await this.usecase.execute(id);

    if (!qrCodeStatic) return null;

    const response = new HandlePendingQrCodeStaticEventResponse({
      id: qrCodeStatic.id,
      state: qrCodeStatic.state,
      createdAt: qrCodeStatic.createdAt,
    });

    this.logger.info('Handle deleting event by ID response.', {
      qrCodeStatic: response,
    });

    return response;
  }
}
