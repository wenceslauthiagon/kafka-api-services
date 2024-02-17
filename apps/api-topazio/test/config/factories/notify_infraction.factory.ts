// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import {
  NotifyInfractionEntity,
  NotifyStateType,
} from '@zro/api-topazio/domain';
import {
  PixInfractionAnalysisResultType,
  PixInfractionStatus,
  PixInfractionType,
  PixInfractionReport,
} from '@zro/pix-payments/domain';
import { NotifyInfractionModel } from '@zro/api-topazio/infrastructure';

/**
 * Infraction model factory.
 */
factory.define<NotifyInfractionModel>(
  NotifyInfractionModel.name,
  NotifyInfractionModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      infractionId: faker.datatype.uuid(),
      operationTransactionId: faker.datatype.uuid(),
      ispb: faker.datatype.number(99999).toString().padStart(8, '0'),
      endToEndId: faker.datatype.uuid(),
      infractionType: PixInfractionType.FRAUD,
      reportedBy: PixInfractionReport.CREDITED_PARTICIPANT,
      reportDetails: faker.datatype.uuid(),
      status: PixInfractionStatus.ACKNOWLEDGED,
      debitedParticipant: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      creditedParticipant: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      creationDate: new Date(),
      lastChangeDate: new Date(),
      analysisResult: PixInfractionAnalysisResultType.AGREED,
      analysisDetails: faker.datatype.uuid(),
      isReporter: faker.datatype.boolean(),
      closingDate: new Date(),
      cancellationDate: new Date(),
      state: NotifyStateType.READY,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
);

/**
 * Infraction entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, NotifyInfractionEntity.name);

factory.define<NotifyInfractionEntity>(
  NotifyInfractionEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      infractionId: faker.datatype.uuid(),
      operationTransactionId: faker.datatype.uuid(),
      ispb: faker.datatype.number(99999).toString().padStart(8, '0'),
      endToEndId: faker.datatype.uuid(),
      infractionType: PixInfractionType.FRAUD,
      reportedBy: PixInfractionReport.CREDITED_PARTICIPANT,
      reportDetails: faker.datatype.uuid(),
      status: PixInfractionStatus.ACKNOWLEDGED,
      debitedParticipant: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      creditedParticipant: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      creationDate: new Date(),
      lastChangeDate: new Date(),
      analysisResult: PixInfractionAnalysisResultType.AGREED,
      analysisDetails: faker.datatype.uuid(),
      isReporter: faker.datatype.boolean(),
      closingDate: new Date(),
      cancellationDate: new Date(),
      state: NotifyStateType.READY,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  },
  {
    afterBuild: (model) => {
      return new NotifyInfractionEntity(model);
    },
  },
);

export const NotifyInfractionFactory = factory;
