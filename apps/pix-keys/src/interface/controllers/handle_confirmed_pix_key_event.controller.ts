import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import {
  HandleConfirmedPixKeyEventUseCase as UseCase,
  PixKeyGateway,
  PixKeyEvent,
} from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export type HandleConfirmedPixKeyEventRequest = PixKeyEvent;

export interface HandleConfirmedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleConfirmedPixKeyEventController {
  /**
   * Handler triggered when key was added successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter PixKey event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Global logger.
   */
  constructor(
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    pspGateway: PixKeyGateway,
    private logger: Logger,
    ispb: string,
  ) {
    this.logger = logger.child({
      context: HandleConfirmedPixKeyEventController.name,
    });

    const eventEmitter = new PixKeyEventEmitterController(serviceEventEmitter);

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      eventEmitter,
      pspGateway,
      ispb,
    );
  }

  async execute(
    request: HandleConfirmedPixKeyEventRequest,
  ): Promise<HandleConfirmedPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle added event by Pix ID.', { request });

    const pixKey = await this.usecase.execute(id);

    return handleAddedPixKeyEventPresenter(pixKey);
  }
}

function handleAddedPixKeyEventPresenter(
  pixKey: PixKey,
): HandleConfirmedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleConfirmedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
