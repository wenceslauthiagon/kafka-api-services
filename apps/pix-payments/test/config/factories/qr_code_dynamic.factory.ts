// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cnpj, cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { PersonType, UserEntity } from '@zro/users/domain';
import { PixKeyEntity } from '@zro/pix-keys/domain';
import {
  QrCodeDynamicEntity,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import { QrCodeDynamicModel } from '@zro/pix-payments/infrastructure';

/**
 * QrCodeDynamic factory.
 */
factory.define<QrCodeDynamicModel>(
  QrCodeDynamicModel.name,
  QrCodeDynamicModel,
  () => {
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      keyId: faker.datatype.uuid(),
      documentValue: faker.datatype.number({ min: 1, max: 99999 }),
      summary: faker.datatype.string(),
      description: faker.datatype.string(),
      dueDate: faker.date.recent(99),
      expirationDate: faker.date.recent(99),
      state: PixQrCodeDynamicState.READY,
      emv: faker.datatype.string(),
      paymentLinkUrl: faker.datatype.string(),
      txId: faker.datatype.string(),
      recipientCity: faker.address.cityName(),
      recipientName: faker.name.fullName(),
      recipientAddress: faker.address.streetAddress(),
      recipientZipCode: faker.address.zipCode(),
      recipientFeredativeUnit: faker.address.stateAbbr(),
      recipientDocument: cpf.generate(),
      recipientPersonType: PersonType.NATURAL_PERSON,
      payerName: faker.name.firstName(),
      payerPersonType: PersonType.LEGAL_PERSON,
      payerDocument: cnpj.generate(),
      payerEmail: faker.internet.email(),
      payerCity: faker.address.cityName(),
      payerPhone: faker.datatype.string(),
      payerAddress: faker.address.streetAddress(),
      payerRequest: faker.datatype.string(),
      allowUpdate: false,
      allowUpdateChange: false,
      allowUpdateWithdrawal: false,
      createdAt: faker.date.recent(99),
    };
  },
);

/**
 * QrCodeDynamic entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, QrCodeDynamicEntity.name);

factory.define<QrCodeDynamicEntity>(
  QrCodeDynamicEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      pixKey: new PixKeyEntity({
        id: faker.datatype.uuid(),
        key: faker.datatype.string(),
      }),
      documentValue: faker.datatype.number({ min: 1, max: 99999 }),
      summary: faker.datatype.string(),
      description: faker.datatype.string(),
      dueDate: faker.date.recent(99),
      expirationDate: faker.date.recent(99),
      state: PixQrCodeDynamicState.READY,
      emv: faker.datatype.string(),
      paymentLinkUrl: faker.datatype.string(),
      txId: faker.datatype.string(),
      recipientCity: faker.address.cityName(),
      recipientName: faker.name.fullName(),
      recipientAddress: faker.address.streetAddress(),
      recipientZipCode: faker.address.zipCode(),
      recipientFeredativeUnit: faker.address.stateAbbr(),
      recipientDocument: cpf.generate(),
      recipientPersonType: PersonType.NATURAL_PERSON,
      payerName: faker.name.firstName(),
      payerPersonType: PersonType.LEGAL_PERSON,
      payerDocument: cnpj.generate(),
      payerEmail: faker.internet.email(),
      payerCity: faker.address.cityName(),
      payerPhone: faker.datatype.string(),
      payerAddress: faker.address.streetAddress(),
      payerRequest: faker.datatype.string(),
      allowUpdate: false,
      allowUpdateChange: false,
      allowUpdateWithdrawal: false,
      createdAt: faker.date.recent(99),
    };
  },
  {
    afterBuild: (model) => {
      return new QrCodeDynamicEntity(model);
    },
  },
);

export const QrCodeDynamicFactory = factory;
