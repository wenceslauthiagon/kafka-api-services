import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  DecodedPixKey,
  DecodedPixKeyRepository,
  DecodedPixKeyState,
} from '@zro/pix-keys/domain';
import {
  DecodedPixKeyEventEmitter,
  DecodedPixKeyInvalidStateException,
  DecodedPixKeyNotFoundException,
} from '@zro/pix-keys/application';

export class UpdateStateByIdDecodedPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param decodedPixKeyRepository Decoded Pix key repository.
   * @param decodedPixKeyEmitter Decoded Pix key event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly decodedPixKeyRepository: DecodedPixKeyRepository,
    private readonly decodedPixKeyEmitter: DecodedPixKeyEventEmitter,
  ) {
    this.logger = logger.child({
      context: UpdateStateByIdDecodedPixKeyUseCase.name,
    });
  }

  /**
   * Update state by decoded pix key by id.
   *
   * @param id The decoded pix key id
   * @param state The decoded pix key state
   * @returns The decoded pix key updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string, state: DecodedPixKeyState): Promise<DecodedPixKey> {
    // Data input check
    if (!id || !state) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!state ? ['State'] : []),
      ]);
    }

    // Search decodedPixKey
    const decodedPixKey = await this.decodedPixKeyRepository.getById(id);

    this.logger.debug('Found decoded pix key.', { decodedPixKey });

    if (!decodedPixKey) {
      throw new DecodedPixKeyNotFoundException({ id });
    }

    decodedPixKey.state = state;

    await this.decodedPixKeyRepository.update(decodedPixKey);

    this.logger.debug('Updated decoded pix key.');

    switch (state) {
      case DecodedPixKeyState.CONFIRMED:
        this.decodedPixKeyEmitter.confirmedDecodedPixKey(decodedPixKey);
        break;
      case DecodedPixKeyState.PENDING:
        this.decodedPixKeyEmitter.pendingDecodedPixKey(decodedPixKey);
        break;
      case DecodedPixKeyState.ERROR:
        this.decodedPixKeyEmitter.errorDecodedPixKey(decodedPixKey);
        break;
      default:
        throw new DecodedPixKeyInvalidStateException({ state });
    }

    return decodedPixKey;
  }
}
