import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { DecodedPixKey, DecodedPixKeyRepository } from '@zro/pix-keys/domain';

export class GetByIdDecodedPixKeyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param decodedPixKeyRepository Decoded Pix key repository.
   */
  constructor(
    private logger: Logger,
    private readonly decodedPixKeyRepository: DecodedPixKeyRepository,
  ) {
    this.logger = logger.child({ context: GetByIdDecodedPixKeyUseCase.name });
  }

  /**
   * Get the decoded pix key by id.
   *
   * @param {UUID} id The decoded pix key id
   * @returns {DecodedPixKey} DecodedPixKey found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(id: string): Promise<DecodedPixKey> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['Decoded Pix Key ID']);
    }

    // Search decodedPixKey
    const decodedPixKey = await this.decodedPixKeyRepository.getById(id);

    this.logger.debug('Found decoded pix key.', { decodedPixKey });

    return decodedPixKey;
  }
}
