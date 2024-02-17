import { PixFraudDetection } from '@zro/pix-payments/domain';

export interface PixFraudDetectionRepository {
  /**
   * Insert a PixFraudDetection.
   * @param pixFraudDetection PixFraudDetection to save.
   * @returns Created PixFraudDetection.
   */
  create: (pixFraudDetection: PixFraudDetection) => Promise<PixFraudDetection>;

  /**
   * Update a PixFraudDetection.
   * @param PixFraudDetection PixFraudDetection to update.
   * @returns Updated PixFraudDetection.
   */
  update: (pixFraudDetection: PixFraudDetection) => Promise<PixFraudDetection>;

  /**
   * Search by PixFraudDetection ID.
   * @param id PixFraudDetection ID.
   * @return Found PixFraudDetection.
   */
  getById: (id: string) => Promise<PixFraudDetection>;

  /**
   * Search by PixFraudDetection issueId.
   * @param issueId PixFraudDetection issueId.
   * @return Found PixFraudDetection.
   */
  getByIssueId: (issueId: number) => Promise<PixFraudDetection>;

  /**
   * Search by PixFraudDetection External ID.
   * @param id PixFraudDetection External ID.
   * @return Found PixFraudDetection.
   */
  getByExternalId: (externalId: string) => Promise<PixFraudDetection>;
}
