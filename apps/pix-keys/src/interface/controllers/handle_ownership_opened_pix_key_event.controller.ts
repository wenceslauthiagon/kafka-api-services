import { Logger } from 'winston';
import {
  HandleOwnershipOpenedPixKeyEventUseCase as UseCase,
  PixKeyGateway,
  PixKeyEvent,
} from '@zro/pix-keys/application';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export type HandleOwnershipOpenedPixKeyEventRequest = PixKeyEvent;

export interface HandleOwnershipOpenedPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandleOwnershipOpenedPixKeyEventController {
  /**
   * Handler triggered when key was sent successfully to DICT.
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
      context: HandleOwnershipOpenedPixKeyEventController.name,
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
    request: HandleOwnershipOpenedPixKeyEventRequest,
  ): Promise<HandleOwnershipOpenedPixKeyEventResponse> {
    const { id } = request;
    this.logger.debug('Handle ownership opened event by Pix ID.', { request });

    const pixKey = await this.usecase.execute(id);

    return handleOwnershipOpenedPixKeyEventPresenter(pixKey);
  }
}

function handleOwnershipOpenedPixKeyEventPresenter(
  pixKey: PixKey,
): HandleOwnershipOpenedPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandleOwnershipOpenedPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
