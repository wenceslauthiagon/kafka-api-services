import { DatabaseRepository } from '@zro/common';
import { P2PTransfer, P2PTransferRepository } from '@zro/operations/domain';
import { P2PTransferModel } from '@zro/operations/infrastructure';

export class P2PTransferDatabaseRepository
  extends DatabaseRepository
  implements P2PTransferRepository
{
  /**
   * Convert P2PTransfer model to P2PTransfer domain.
   * @param p2pTransfer Model instance.
   * @returns Domain instance.
   */
  static toDomain(p2pTransfer: P2PTransferModel): P2PTransfer {
    return p2pTransfer?.toDomain() ?? null;
  }

  async create(p2pTransfer: P2PTransfer): Promise<P2PTransfer> {
    return P2PTransferModel.create(p2pTransfer, {
      transaction: this.transaction,
    }).then(P2PTransferDatabaseRepository.toDomain);
  }

  /**
   * Get p2pTransfer by uuid.
   *
   * @param id P2PTransfer id.
   * @returns P2PTransfer if found or null otherwise.
   */
  async getById(id: string): Promise<P2PTransfer> {
    return P2PTransferModel.findOne({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(P2PTransferDatabaseRepository.toDomain);
  }
}
