import * as uuid from 'uuid';
import { Logger } from 'winston';
import { ICieloService } from '@zro/cielo/application';
import {
  CheckoutHistoric,
  CheckoutRepository,
  CheckoutHistoricRepository,
} from '@zro/cielo/domain';
import { CancelTransactionResponse } from '@zro/cielo/interface';
import { CieloTransactionStatusEnum } from '@zro/cielo/infrastructure';
import { NotFoundException } from '@nestjs/common';

export class CancelTransactionUsecase {
  constructor(
    private logger: Logger,
    private cieloService: ICieloService,
    private checkoutRepository: CheckoutRepository,
    private checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {}

  async execute(checkoutId: string): Promise<CancelTransactionResponse> {
    this.logger.debug('Receive payment refund data.', { checkoutId });

    const checkout = await this.checkoutRepository.getById(checkoutId);

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    const cieloResponse = await this.cieloService.cancelTransaction(
      checkout.referenceId,
      checkout.amount,
    );

    this.logger.debug('Created cancel/refund data.', { cieloResponse });

    const historics = await this.checkoutHistoricRepository.findByCheckoutId(
      checkout.id,
    );

    if (historics && historics.length > 0) checkout.historic = historics;

    const historicModel = await this.checkoutHistoricRepository.create(
      this.createCheckoutHistoricModel(checkout, cieloResponse),
    );

    this.logger.debug('Created Checkout Historic data.', { historicModel });

    //sync payment infos
    checkout.status = this.getEnumKey(
      CieloTransactionStatusEnum,
      cieloResponse.Status,
    );

    const updatedModel = await this.checkoutRepository.update(checkout);

    return this.toResponse(updatedModel.status, updatedModel.id);
  }

  createCheckoutHistoricModel(checkout: any, response: any) {
    const historicModel: CheckoutHistoric = {
      id: uuid.v4(),
      checkoutId: checkout.id,
      currentStatus: this.getCurrentStatus(checkout),
      previousStatus: this.getEnumKey(
        CieloTransactionStatusEnum,
        response.Status,
      ),
      action: 'refund',
      response: response,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return historicModel;
  }

  getEnumKey<T>(enumObj: T, enumValue: number): keyof T | undefined {
    return (Object.keys(enumObj) as Array<keyof T>).find(
      (key) => enumObj[key] === enumValue,
    );
  }

  getCurrentStatus(checkout) {
    if (checkout && checkout.historic && checkout.historic.length > 0) {
      const latest = checkout.historic[checkout.historic.length - 1];
      return latest.currentStatus;
    }
    return null;
  }

  toResponse(status: string, checkoutId: string): CancelTransactionResponse {
    return {
      Status: status,
      CheckoutId: checkoutId,
    };
  }
}
