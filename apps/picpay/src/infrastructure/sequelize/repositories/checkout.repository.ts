import { Injectable } from '@nestjs/common';
import { CheckoutRepository } from '@zro/picpay/domain/repositories/checkout.repository';

import { Op, Transaction } from 'sequelize';
import { CheckoutModel } from '../models/checkout.model';
import { DatabaseRepository } from '@zro/common';
import { Checkout } from '@zro/picpay/domain/entities/checkout.entity';

@Injectable()
export class CheckoutDatabaseRepository
  extends DatabaseRepository
  implements CheckoutRepository
{
  constructor(transaction?: Transaction) {
    super(transaction);
  }

  static toDomain(checkout: CheckoutModel): Checkout {
    return checkout?.toDomain() ?? null;
  }

  async create(checkout: Checkout): Promise<Checkout> {
    const createdCheckout = await CheckoutModel.create<CheckoutModel>(
      checkout,
      {
        transaction: this.transaction,
      },
    );

    checkout.createdAt = createdCheckout.createdAt;

    return checkout;
  }

  async getById(id: string): Promise<Checkout> {
    return CheckoutModel.findOne<CheckoutModel>({
      where: {
        id,
      },
      transaction: this.transaction,
    }).then(CheckoutDatabaseRepository.toDomain);
  }

  async getByReferenceId(referenceId: string): Promise<Checkout> {
    return CheckoutModel.findOne<CheckoutModel>({
      where: {
        referenceId,
      },
      transaction: this.transaction,
    }).then(CheckoutDatabaseRepository.toDomain);
  }

  async findCheckoutPending(): Promise<CheckoutModel[]> {
    return CheckoutModel.findAll({
      where: {
        status: {
          [Op.or]: ['created', 'paid'],
        },
        expiresAt: {
          [Op.gte]: new Date(),
        },
      },
      transaction: this.transaction,
    });
  }

  async update(checkout: Checkout): Promise<Checkout> {
    await CheckoutModel.update<CheckoutModel>(checkout, {
      where: { id: checkout.id },
      transaction: this.transaction,
    });

    return checkout;
  }
}
