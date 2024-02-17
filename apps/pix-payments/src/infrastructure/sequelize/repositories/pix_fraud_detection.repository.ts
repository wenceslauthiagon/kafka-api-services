import { DatabaseRepository } from '@zro/common';
import {
  PixFraudDetection,
  PixFraudDetectionRepository,
} from '@zro/pix-payments/domain';
import { PixFraudDetectionModel } from '@zro/pix-payments/infrastructure';

export class PixFraudDetectionDatabaseRepository
  extends DatabaseRepository
  implements PixFraudDetectionRepository
{
  static toDomain(
    pixFraudDetectionModel: PixFraudDetectionModel,
  ): PixFraudDetection {
    return pixFraudDetectionModel?.toDomain() ?? null;
  }

  /**
   * Insert a PixFraudDetection.
   * @param pixFraudDetection PixFraudDetection to save.
   * @returns Created PixFraudDetection.
   */
  async create(
    pixFraudDetection: PixFraudDetection,
  ): Promise<PixFraudDetection> {
    const pixFraudDetectionGenerated =
      await PixFraudDetectionModel.create<PixFraudDetectionModel>(
        pixFraudDetection,
        {
          transaction: this.transaction,
        },
      );

    pixFraudDetection.createdAt = pixFraudDetectionGenerated.createdAt;
    return pixFraudDetection;
  }

  /**
   * Update a PixFraudDetection.
   * @param PixFraudDetection PixFraudDetection to update.
   * @returns Updated PixFraudDetection.
   */
  async update(
    pixFraudDetection: PixFraudDetection,
  ): Promise<PixFraudDetection> {
    await PixFraudDetectionModel.update<PixFraudDetectionModel>(
      pixFraudDetection,
      {
        where: { id: pixFraudDetection.id },
        transaction: this.transaction,
      },
    );

    return pixFraudDetection;
  }

  /**
   * Search by PixFraudDetection ID.
   * @param id PixFraudDetection ID.
   * @return Found PixFraudDetection.
   */
  async getById(id: string): Promise<PixFraudDetection> {
    return PixFraudDetectionModel.findOne<PixFraudDetectionModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(PixFraudDetectionDatabaseRepository.toDomain);
  }

  /**
   * Search by PixFraudDetection issueId.
   * @param issueId PixFraudDetection issueId.
   * @return Found PixFraudDetection.
   */
  async getByIssueId(issueId: number): Promise<PixFraudDetection> {
    return PixFraudDetectionModel.findOne<PixFraudDetectionModel>({
      where: {
        issueId,
      },
      transaction: this.transaction,
    }).then(PixFraudDetectionDatabaseRepository.toDomain);
  }

  /**
   * Search by PixFraudDetection External ID.
   * @param id PixFraudDetection External ID.
   * @return Found PixFraudDetection.
   */
  async getByExternalId(externalId: string): Promise<PixFraudDetection> {
    return PixFraudDetectionModel.findOne<PixFraudDetectionModel>({
      where: {
        externalId,
      },
      transaction: this.transaction,
    }).then(PixFraudDetectionDatabaseRepository.toDomain);
  }
}
