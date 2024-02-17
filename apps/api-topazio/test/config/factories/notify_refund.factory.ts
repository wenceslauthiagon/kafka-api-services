// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { NotifyRefundModel } from '@zro/api-topazio/infrastructure';
import { NotifyRefundEntity, NotifyStateType } from '@zro/api-topazio/domain';
import { PixRefundReason, PixRefundStatus } from '@zro/pix-payments/domain';

/**
 * Notify Refund model factory.
 */
factory.define<NotifyRefundModel>(
  NotifyRefundModel.name,
  NotifyRefundModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      solicitationId: faker.datatype.uuid(),
      transactionId: faker.datatype.uuid(),
      contested: faker.datatype.boolean(),
      endToEndId: faker.datatype.uuid(),
      refundAmount: faker.datatype.number({ min: 1, max: 99999 }),
      refundDetails: faker.datatype.uuid(),
      refundReason: PixRefundReason.FRAUD,
      requesterIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      responderIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      status: PixRefundStatus.OPEN,
      creationDate: new Date(),
      devolutionId: faker.datatype.uuid(),
      infractionId: faker.datatype.uuid(),
      lastChangeDate: new Date(),
      state: NotifyStateType.READY,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
);

/**
 * Notify refund entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyRefundEntity.name);

factory.define<NotifyRefundEntity>(
  NotifyRefundEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      solicitationId: faker.datatype.uuid(),
      transactionId: faker.datatype.uuid(),
      contested: faker.datatype.boolean(),
      endToEndId: faker.datatype.uuid(),
      refundAmount: faker.datatype.number({ min: 1, max: 99999 }),
      refundDetails: faker.datatype.uuid(),
      refundReason: PixRefundReason.FRAUD,
      requesterIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      responderIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      status: PixRefundStatus.OPEN,
      creationDate: new Date(),
      devolutionId: faker.datatype.uuid(),
      infractionId: faker.datatype.uuid(),
      lastChangeDate: new Date(),
      state: NotifyStateType.READY,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyRefundEntity(model);
    },
  },
);

export const NotifyRefundFactory = factory;
