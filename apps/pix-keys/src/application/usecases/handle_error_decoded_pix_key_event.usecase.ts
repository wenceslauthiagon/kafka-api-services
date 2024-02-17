import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  DecodedPixKey,
  DecodedPixKeyRepository,
  DecodedPixKeyEntity,
  DecodedPixKeyState,
  KeyType,
} from '@zro/pix-keys/domain';
import { User } from '@zro/users/domain';
import { InvalidStateDecodedPixKeyException } from '@zro/pix-keys/application';

export class HandleErrorDecodedPixKeyEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param decodedPixKeyRepository Decoded pix key repository.
   * @param ispb Zro Bank's default ispb code.
   */
  constructor(
    private logger: Logger,
    private readonly decodedPixKeyRepository: DecodedPixKeyRepository,
    private readonly ispb: string,
  ) {
    this.logger = logger.child({
      context: HandleErrorDecodedPixKeyEventUseCase.name,
    });
  }

  async execute(
    id: string,
    user: User,
    key: string,
    type: KeyType,
    state: DecodedPixKeyState,
  ): Promise<DecodedPixKey> {
    if (!id || !user?.uuid || !key || !type || !state) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user?.uuid ? ['User ID'] : []),
        ...(!key ? ['Key'] : []),
        ...(!type ? ['Type'] : []),
        ...(!state ? ['State'] : []),
      ]);
    }

    const decodedPixKey = await this.decodedPixKeyRepository.getById(id);

    this.logger.debug('Decoded pix key found.', { decodedPixKey });

    if (decodedPixKey) {
      return decodedPixKey;
    }

    if (state !== DecodedPixKeyState.ERROR) {
      throw new InvalidStateDecodedPixKeyException(state);
    }

    const decodedPixKeyEntity = new DecodedPixKeyEntity({
      id,
      ispb: this.ispb,
      state,
      key,
      type,
      user,
    });

    await this.decodedPixKeyRepository.create(decodedPixKeyEntity);

    this.logger.debug('Error decoded key created.', { decodedPixKeyEntity });

    return decodedPixKeyEntity;
  }
}
