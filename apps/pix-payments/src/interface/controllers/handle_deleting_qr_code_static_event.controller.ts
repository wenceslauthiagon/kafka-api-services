import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  HandleDeletingQrCodeStaticEventUseCase as UseCase,
  PixPaymentGateway,
} from '@zro/pix-payments/application';
import {
  QrCodeStaticControllerEvent,
  QrCodeStaticEventEmitterController,
  QrCodeStaticEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export class HandleDeletingQrCodeStaticEventRequest extends QrCodeStaticControllerEvent {}

type THandleDeletingQrCodeStaticEventResponse = Pick<
  QrCodeStatic,
  'id' | 'state' | 'createdAt'
>;

export class HandleDeletingQrCodeStaticEventResponse
  extends AutoValidator
  implements THandleDeletingQrCodeStaticEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(QrCodeStaticState)
  state!: QrCodeStaticState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandleDeletingQrCodeStaticEventResponse) {
    super(props);
  }
}

export class HandleDeletingQrCodeStaticEventController {
  /**
   * Handler triggered when qrCodeStatic was deleted.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param eventEmitter QrCodeStatic event emitter.
   * @param pspGateway Psp gateway.
   */
  constructor(
    private logger: Logger,
    qrCodeStaticRepository: QrCodeStaticRepository,
    eventEmitter: QrCodeStaticEventEmitterControllerInterface,
    pspGateway: PixPaymentGateway,
  ) {
    this.logger = logger.child({
      context: HandleDeletingQrCodeStaticEventController.name,
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
    request: HandleDeletingQrCodeStaticEventRequest,
  ): Promise<HandleDeletingQrCodeStaticEventResponse> {
    this.logger.debug('Handle deleting event by ID request.', { request });

    const { id } = request;

    const qrCodeStatic = await this.usecase.execute(id);

    if (!qrCodeStatic) return null;

    const response = new HandleDeletingQrCodeStaticEventResponse({
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
