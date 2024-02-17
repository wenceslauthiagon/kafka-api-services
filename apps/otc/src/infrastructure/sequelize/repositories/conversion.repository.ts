import { Op } from 'sequelize';
import {
  DatabaseRepository,
  Pagination,
  paginationToDomain,
  paginationWhere,
  TPaginationResponse,
  getMoment,
} from '@zro/common';
import {
  Conversion,
  ConversionRepository,
  TGetConversionFilter,
} from '@zro/otc/domain';
import { User } from '@zro/users/domain';
import { Operation } from '@zro/operations/domain';
import { ConversionModel } from '@zro/otc/infrastructure';

export class ConversionDatabaseRepository
  extends DatabaseRepository
  implements ConversionRepository
{
  static toDomain(model: ConversionModel): Conversion {
    return model?.toDomain() ?? null;
  }

  async create(conversion: Conversion): Promise<Conversion> {
    const createdConversion = await ConversionModel.create<ConversionModel>(
      conversion,
      { transaction: this.transaction },
    );

    conversion.id = createdConversion.id;
    conversion.createdAt = createdConversion.createdAt;

    return conversion;
  }

  async update(conversion: Conversion): Promise<Conversion> {
    await ConversionModel.update<ConversionModel>(conversion, {
      where: { id: conversion.id },
      transaction: this.transaction,
    });

    return conversion;
  }

  async getById(id: string): Promise<Conversion> {
    return ConversionModel.findOne<ConversionModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(ConversionDatabaseRepository.toDomain);
  }

  async getByUserAndId(user: User, id: string): Promise<Conversion> {
    return ConversionModel.findOne<ConversionModel>({
      where: {
        id,
        userUUID: user.uuid,
      },
      transaction: this.transaction,
    }).then(ConversionDatabaseRepository.toDomain);
  }

  async getByOperation(operation: Operation): Promise<Conversion> {
    return ConversionModel.findOne<ConversionModel>({
      where: {
        operationId: operation.id,
      },
      transaction: this.transaction,
    }).then(ConversionDatabaseRepository.toDomain);
  }

  async getByUserAndOperation(
    user: User,
    operation: Operation,
  ): Promise<Conversion> {
    return ConversionModel.findOne<ConversionModel>({
      where: {
        userUUID: user.uuid,
        operationId: operation.id,
      },
      transaction: this.transaction,
    }).then(ConversionDatabaseRepository.toDomain);
  }

  async getByFilterAndUserAndPagination(
    filter: TGetConversionFilter,
    user: User,
    pagination: Pagination,
  ): Promise<TPaginationResponse<Conversion>> {
    const {
      operationId,
      quotationId,
      currencyId,
      conversionType,
      clientName,
      clientDocument,
      createdAtStart,
      createdAtEnd,
    } = filter;
    const where = {
      userUUID: user.uuid,
      ...(operationId && { operationId }),
      ...(quotationId && { quotationId }),
      ...(currencyId && { currencyId }),
      ...(conversionType && { conversionType }),
      ...(clientName && { clientName }),
      ...(clientDocument && { clientDocument }),
      ...(createdAtStart &&
        createdAtEnd && {
          createdAt: {
            [Op.between]: [
              getMoment(createdAtStart).startOf('day').toISOString(),
              getMoment(createdAtEnd).endOf('day').toISOString(),
            ],
          },
        }),
    };

    return ConversionModel.findAndCountAll<ConversionModel>({
      where,
      ...paginationWhere(pagination),
      transaction: this.transaction,
    }).then((data) =>
      paginationToDomain(
        pagination,
        data.count,
        data.rows.map(ConversionDatabaseRepository.toDomain),
      ),
    );
  }
}
