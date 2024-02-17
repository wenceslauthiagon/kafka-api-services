import { P2PTransfer } from '@zro/operations/domain';

export interface P2PTransferRepository {
  /**
   * Create a P2PTransfer.
   *
   * @param p2pTransfer P2PTransfer to be created.
   * @returns Created P2PTransfer.
   */
  create(p2pTransfer: P2PTransfer): Promise<P2PTransfer>;

  /**
   * Get P2PTransfer by id.
   *
   * @param id P2PTransfer id.
   * @returns P2PTransfer found or null otherwise.
   */
  getById(id: string): Promise<P2PTransfer>;
}
