import { PersonType } from '@zro/users/domain';
import { PixKeyDecodeLimit } from '@zro/pix-keys/domain';

export interface PixKeyDecodeLimitRepository {
  /**
   * Get a pix key decode limit by person type.
   * @returns Found pix key decode limit or null otherwise.
   */
  getByPersonType(personType: PersonType): Promise<PixKeyDecodeLimit>;
}
