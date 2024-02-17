import { User } from '@zro/users/domain';
import { QrCodeDynamic } from '@zro/pix-payments/domain';

export interface QrCodeDynamicRepository {
  /**
   * Search by QrCodeDynamic ID.
   * @param id QrCodeDynamic ID.
   * @return QrCodeDynamic found.
   */
  getById: (id: string) => Promise<QrCodeDynamic>;

  /**
   * Search by QrCodeDynamic ID.
   * @param id QrCodeDynamic ID.
   * @param user id to get.
   * @return QrCodeDynamic found.
   */
  getByIdAndUser: (id: string, user: User) => Promise<QrCodeDynamic>;

  /**
   * Insert a QrCodeDynamic.
   * @param qrCodeStatic QrCodeDynamic to save.
   * @returns Created QrCodeDynamic.
   */
  create: (qrCodeStatic: QrCodeDynamic) => Promise<QrCodeDynamic>;

  /**
   * Update a QrCodeDynamic.
   * @param qrCodeStatic QrCodeDynamic to update.
   * @returns Updated QrCodeDynamic.
   */
  update: (qrCodeStatic: QrCodeDynamic) => Promise<QrCodeDynamic>;
}
