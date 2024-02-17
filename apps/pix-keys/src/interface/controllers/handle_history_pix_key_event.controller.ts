import { Logger } from 'winston';
import {
  HandleHistoryPixKeyEventUseCase as UseCase,
  PixKeyEvent,
} from '@zro/pix-keys/application';
import {
  PixKeyRepository,
  KeyState,
  PixKeyHistory,
  PixKeyHistoryRepository,
} from '@zro/pix-keys/domain';

export type HandleHistoryPixKeyEventRequest = PixKeyEvent;

export interface HandleHistoryPixKeyEventResponse {
  id: string;
  pixKeyId: string;
  state: KeyState;
  createdAt: Date;
}

export class HandleHistoryPixKeyEventController {
  /**
   * Handler triggered when status pix key change.
   */
  private usecase: UseCase;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param pixKeyHistoryRepository Pix key history repository.
   */
  constructor(
    private logger: Logger,
    pixKeyRepository: PixKeyRepository,
    pixKeyHistoryRepository: PixKeyHistoryRepository,
  ) {
    this.logger = logger.child({
      context: HandleHistoryPixKeyEventController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      pixKeyRepository,
      pixKeyHistoryRepository,
    );
  }

  async execute(
    request: HandleHistoryPixKeyEventRequest,
  ): Promise<HandleHistoryPixKeyEventResponse> {
    const { id, state } = request;
    this.logger.debug('Handle state history event.', { request });

    const pixKeyHistory = await this.usecase.execute(id, state);

    return handleHistoryPixKeyEventPresenter(pixKeyHistory);
  }
}

function handleHistoryPixKeyEventPresenter(
  pixKeyHistory: PixKeyHistory,
): HandleHistoryPixKeyEventResponse {
  if (!pixKeyHistory) return null;

  const response: HandleHistoryPixKeyEventResponse = {
    id: pixKeyHistory.id,
    pixKeyId: pixKeyHistory.pixKey.id,
    state: pixKeyHistory.state,
    createdAt: pixKeyHistory.createdAt,
  };

  return response;
}
