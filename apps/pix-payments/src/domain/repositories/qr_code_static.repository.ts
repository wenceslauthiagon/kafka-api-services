import { Pagination, TPaginationResponse } from '@zro/common';
import { User } from '@zro/users/domain';
import { PixKey } from '@zro/pix-keys/domain';
import { QrCodeStatic } from '@zro/pix-payments/domain';

export interface QrCodeStaticRepository {
  /**
   * Insert a QrCodeStatic.
   * @param qrCodeStatic QrCodeStatic to save.
   * @returns Created QrCodeStatic.
   */
  create: (qrCodeStatic: QrCodeStatic) => Promise<QrCodeStatic>;

  /**
   * Update a QrCodeStatic.
   * @param QrCodeStatic QrCodeStatic to update.
   * @returns Updated QrCodeStatic.
   */
  update: (qrCodeStatic: QrCodeStatic) => Promise<QrCodeStatic>;

  /**
   * Delete QrCodeStatic by id.
   * @param id QrCodeStatic ID.
   * @return The amount of deleted.
   */
  deleteById: (id: string) => Promise<number>;

  /**
   * Search by QrCodeStatic ID.
   * @param id QrCodeStatic ID.
   * @return QrCodeStatic found.
   */
  getById: (id: string) => Promise<QrCodeStatic>;

  /**
   * Search by QrCodeStatic pixKey ID.
   * @param pixKey the pixKey.
   * @return QrCodeStatics found.
   */
  getByPixKey: (pixKey: PixKey) => Promise<QrCodeStatic[]>;

  /**
   * List all QrCodeStatic by user.
   * @param user QrCodeStatic's user.
   * @param pagination The pagination.
   * @return QrCodeStatics found.
   */
  getAllByUser: (
    user: User,
    pagination: Pagination,
  ) => Promise<TPaginationResponse<QrCodeStatic>>;
}
