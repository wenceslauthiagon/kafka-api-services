import { Logger } from 'winston';
import {
  PixKey,
  PixKeyRepository,
  KeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import {
  HandlePortabilityCancelingPixKeyEventUseCase as UseCase,
  PixKeyGateway,
  PixKeyReasonEvent,
} from '@zro/pix-keys/application';
import {
  PixKeyEventEmitterController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export type HandlePortabilityCancelingPixKeyEventRequest = PixKeyReasonEvent;

export interface HandlePortabilityCancelingPixKeyEventResponse {
  id: string;
  key: string;
  type: KeyType;
  state: KeyState;
  createdAt: Date;
}

export class HandlePortabilityCancelingPixKeyEventController {
  /**
   * Handler triggered when key must be sent successfully to DICT.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter PixKey event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Global logger.
   * @param ispb ispb
   */
  constructor(
    pixKeyRepository: PixKeyRepository,
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    pspGateway: PixKeyGateway,
    private logger: Logger,
    ispb: string,
  ) {
    this.logger = logger.child({
      context: HandlePortabilityCancelingPixKeyEventController.name,
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
    request: HandlePortabilityCancelingPixKeyEventRequest,
  ): Promise<HandlePortabilityCancelingPixKeyEventResponse> {
    this.logger.debug('Handle portability canceling event by Pix ID.', {
      request,
    });
    const { id, reason } = request;

    const pixKey = await this.usecase.execute(id, reason);

    return handleClaimDeniedPixKeyEventPresenter(pixKey);
  }
}

function handleClaimDeniedPixKeyEventPresenter(
  pixKey: PixKey,
): HandlePortabilityCancelingPixKeyEventResponse {
  if (!pixKey) return null;

  const response: HandlePortabilityCancelingPixKeyEventResponse = {
    id: pixKey.id,
    key: pixKey.key,
    type: pixKey.type,
    state: pixKey.state,
    createdAt: pixKey.createdAt,
  };

  return response;
}
