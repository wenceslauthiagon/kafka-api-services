// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import {
  PixInfractionAnalysisResultType,
  PixInfractionEntity,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionType,
  PixInfractionReport,
  PixInfractionTransactionType,
} from '@zro/pix-payments/domain';
import { OperationEntity } from '@zro/operations/domain';
import { PixInfractionModel } from '@zro/pix-payments/infrastructure';

const fakerModel = () => ({
  id: faker.datatype.uuid(),
  issueId: faker.datatype.number({ min: 1, max: 999 }),
  infractionPspId: faker.datatype.uuid(),
  operation: new OperationEntity({ id: faker.datatype.uuid() }),
  transactionType: PixInfractionTransactionType.DEPOSIT,
  transaction: { id: faker.datatype.uuid() },
  description: faker.datatype.string(),
  infractionType: PixInfractionType.FRAUD,
  status: PixInfractionStatus.OPEN,
  state: PixInfractionState.OPEN_PENDING,
  analysisResult: PixInfractionAnalysisResultType.AGREED,
  reportBy: PixInfractionReport.CREDITED_PARTICIPANT,
  ispbDebitedParticipant: faker.datatype
    .number({ min: 0, max: 99999 })
    .toString()
    .padStart(8, '0'),
  ispbCreditedParticipant: faker.datatype
    .number({ min: 0, max: 99999 })
    .toString()
    .padStart(8, '0'),
  ispb: faker.datatype
    .number({ min: 0, max: 99999 })
    .toString()
    .padStart(8, '0'),
  endToEndId: faker.datatype.uuid(),
  creationDate: faker.date.recent(),
  lastChangeDate: faker.date.recent(),
  analysisDetails: faker.lorem.words(20),
  isReporter: faker.datatype.boolean(),
  closingDate: faker.date.recent(),
  cancellationDate: faker.date.recent(),
  createdAt: faker.date.recent(),
  updatedAt: faker.date.recent(),
});

/**
 * PixInfraction model factory.
 */
factory.define<PixInfractionModel>(
  PixInfractionModel.name,
  PixInfractionModel,
  () => fakerModel(),
);

/**
 * PixInfraction entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, PixInfractionEntity.name);

factory.define<PixInfractionEntity>(
  PixInfractionEntity.name,
  DefaultModel,
  () => fakerModel(),
  {
    afterBuild: (model) => {
      return new PixInfractionEntity(model);
    },
  },
);

export const InfractionFactory = factory;
