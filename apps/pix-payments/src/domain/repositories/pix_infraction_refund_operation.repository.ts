import {
  PixInfraction,
  PixInfractionRefundOperation,
  PixRefund,
} from '@zro/pix-payments/domain';
import { User } from '@zro/users/domain';

export type TGetPixInfractionRefundOperationFilter = {
  user?: User;
  pixInfraction?: PixInfraction;
  pixRefund?: PixRefund;
  states?: PixInfractionRefundOperation['state'][];
};

export enum PixInfractionRefundOperationRequestSort {
  CREATED_AT = 'created_at',
}

export interface PixInfractionRefundOperationRepository {
  /**
   * Create PixInfractionRefundOperation.
   *
   * @param pixInfractionRefundOperation New PixInfractionRefundOperation.
   * @returns Created or Updated PixInfractionRefundOperation.
   */
  create: (
    pixInfractionRefundOperation: PixInfractionRefundOperation,
  ) => Promise<PixInfractionRefundOperation>;

  /**
   * Update PixInfractionRefundOperation.
   *
   * @param pixInfractionRefundOperation PixInfractionRefundOperation to be updated.
   * @returns Updated PixInfractionRefundOperation.
   */
  update: (
    pixInfractionRefundOperation: PixInfractionRefundOperation,
  ) => Promise<PixInfractionRefundOperation>;

  /**
   * Get PixInfractionRefundOperation by filter.
   * @param filter Filter.
   * @returns PixInfractionRefundOperation found or null otherwise.
   */
  getByFilter: (
    filter: TGetPixInfractionRefundOperationFilter,
  ) => Promise<PixInfractionRefundOperation>;

  /**
   * Get PixInfractionRefundOperation by id.
   * @param id PixInfractionRefundOperation id.
   * @returns PixInfractionRefundOperation found or null otherwise.
   */
  getById: (id: string) => Promise<PixInfractionRefundOperation>;

  /**
   * Get PixInfractionRefundOperation by filter.
   * @param filter Filter.
   * @returns PixInfractionRefundOperations found or null otherwise.
   */
  getAllByFilter: (
    filter: TGetPixInfractionRefundOperationFilter,
  ) => Promise<PixInfractionRefundOperation[]>;
}
