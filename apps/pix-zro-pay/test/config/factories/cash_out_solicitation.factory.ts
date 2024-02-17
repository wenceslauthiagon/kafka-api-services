// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { CashOutSolicitationModel } from '@zro/pix-zro-pay/infrastructure';
import { CashOutSolicitationEntity } from '@zro/pix-zro-pay/domain';

/**
 * Bank factory.
 */
factory.define<CashOutSolicitationModel>(
  CashOutSolicitationModel.name,
  CashOutSolicitationModel,
  () => {
    return {
      id: faker.datatype.number(),
      valueCents: faker.datatype.number(10000),
      paymentDate: new Date(),
      financialEmail: faker.internet.email(),
      responsibleUserObservation: faker.lorem.sentence(),
      providerHolderName: faker.name.fullName(),
      providerHolderCnpj: '71083191000140',
      providerBankName: faker.company.name(),
      providerBankBranch: faker.company.bs(),
      providerBankAccountNumber: faker.finance.account(12),
      providerBankIspb: faker.finance.account(4),
      providerBankAccountType: faker.finance.account(4),
      companyId: 1,
      createdAt: faker.date.recent(2),
    };
  },
);

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, CashOutSolicitationEntity.name);

factory.define<CashOutSolicitationEntity>(
  CashOutSolicitationEntity.name,
  DefaultModel,
  () => {
    return {
      id: faker.datatype.number(),
      valueCents: faker.datatype.number(10000),
      paymentDate: new Date(),
      financialEmail: faker.internet.email(),
      responsibleUserObservation: faker.lorem.sentence(),
      providerHolderName: faker.name.fullName(), //71083191000140
      providerHolderCnpj: '71083191000140',
      providerBankName: faker.company.name(),
      providerBankBranch: faker.company.bs(),
      providerBankAccountNumber: faker.finance.account(12),
      providerBankIspb: faker.finance.account(4),
      providerBankAccountType: faker.finance.account(4),
      companyId: 1,
      createdAt: faker.date.recent(2),
    };
  },
  {
    afterBuild: (model) => {
      return new CashOutSolicitationEntity(model);
    },
  },
);

export const CashOutSolicitationFactory = factory;
