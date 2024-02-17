import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  QrCodeStatic,
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import { HandlePendingFailedQrCodeStaticEventUseCase as UseCase } from '@zro/pix-payments/application';
import {
  QrCodeStaticControllerEvent,
  QrCodeStaticEventEmitterController,
  QrCodeStaticEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export class HandlePendingFailedQrCodeStaticEventRequest extends QrCodeStaticControllerEvent {}

type THandlePendingFailedQrCodeStaticEventResponse = Pick<
  QrCodeStatic,
  'id' | 'state' | 'createdAt'
>;

export class HandlePendingFailedQrCodeStaticEventResponse
  extends AutoValidator
  implements THandlePendingFailedQrCodeStaticEventResponse
{
  @IsUUID(4)
  id!: string;

  @IsEnum(QrCodeStaticState)
  state!: QrCodeStaticState;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt!: Date;

  constructor(props: THandlePendingFailedQrCodeStaticEventResponse) {
    super(props);
  }
}

export class HandlePendingFailedQrCodeStaticEventController {
  /**
   * Handler triggered when an error is thrown.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param eventEmitter QrCodeStatic event emitter.
   */
  constructor(
    private logger: Logger,
    qrCodeStaticRepository: QrCodeStaticRepository,
    eventEmitter: QrCodeStaticEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: HandlePendingFailedQrCodeStaticEventController.name,
    });

    const controllerEventEmitter = new QrCodeStaticEventEmitterController(
      eventEmitter,
    );

    this.usecase = new UseCase(
      this.logger,
      qrCodeStaticRepository,
      controllerEventEmitter,
    );
  }

  async execute(
    request: HandlePendingFailedQrCodeStaticEventRequest,
  ): Promise<HandlePendingFailedQrCodeStaticEventResponse> {
    const { id } = request;
    this.logger.debug('Handle pending failed event by ID request.', {
      request,
    });

    const qrCodeStatic = await this.usecase.execute(id);

    if (!qrCodeStatic) return null;

    const response = new HandlePendingFailedQrCodeStaticEventResponse({
      id: qrCodeStatic.id,
      state: qrCodeStatic.state,
      createdAt: qrCodeStatic.createdAt,
    });

    this.logger.info('Handle pending failed event by ID response.', {
      qrCodeStatic: response,
    });

    return response;
  }
}
