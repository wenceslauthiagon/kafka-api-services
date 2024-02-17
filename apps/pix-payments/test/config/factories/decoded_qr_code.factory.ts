// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common/test';
import { PersonType, UserEntity } from '@zro/users/domain';
import {
  AccountType,
  DecodedQrCodeEntity,
  DecodedQrCodeState,
  DecodedQrCodeType,
  PixAgentMod,
} from '@zro/pix-payments/domain';
import { DecodedQrCodeModel } from '@zro/pix-payments/infrastructure';

const randDocument = () => {
  return Math.random() < 0.5
    ? { doc: cpf.generate(), type: PersonType.NATURAL_PERSON }
    : { doc: cnpj.generate(), type: PersonType.LEGAL_PERSON };
};

/**
 * DecodedQrCode model factory.
 */
factory.define<DecodedQrCodeModel>(
  DecodedQrCodeModel.name,
  DecodedQrCodeModel,
  () => {
    const randRecipient = randDocument();
    return {
      id: faker.datatype.uuid(),
      documentValue: faker.datatype.number({ min: 1, max: 99999 }),
      paymentValue: faker.datatype.number({ min: 1, max: 99999 }),
      emv: faker.datatype.string(),
      document: cpf.generate(),
      cityCode: faker.datatype.string(),
      paymentDate: faker.date.recent(),
      key: faker.datatype.string(),
      txId: faker.datatype.string(),
      recipientName: faker.datatype.string(),
      recipientPersonType: randRecipient.type,
      recipientDocument: randRecipient.doc,
      recipientIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      recipientBranch: faker.datatype.string(),
      recipientAccountType: AccountType.CACC,
      recipientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      recipientCity: faker.datatype.string(),
      endToEndId: faker.datatype.string(),
      type: DecodedQrCodeType.QR_CODE_STATIC_WITHDRAWAL,
      allowUpdate: faker.datatype.boolean(),
      pss: faker.datatype.string(),
      expirationDate: faker.date.recent(),
      status: faker.datatype.string(),
      version: faker.datatype.string(),
      additionalInfo: faker.datatype.string(),
      additionalInfos: [
        { name: faker.datatype.string(), value: faker.datatype.string() },
        { name: faker.datatype.string(), value: faker.datatype.string() },
      ],
      dueDate: faker.date.recent(),
      state: DecodedQrCodeState.PENDING,
      userId: faker.datatype.uuid(),
      recipientBankName: faker.datatype.string(),
      recipientBankIspb: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      agentIspbWithdrawal: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      agentModWithdrawal: PixAgentMod.AGTOT,
      agentIspbChange: faker.datatype.number(99999).toString().padStart(8, '0'),
      agentModChange: PixAgentMod.AGTEC,
    };
  },
);

/**
 * DecodedQrCode entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, DecodedQrCodeEntity.name);

factory.define<DecodedQrCodeEntity>(
  DecodedQrCodeEntity.name,
  DefaultModel,
  async () => {
    const randRecipient = randDocument();
    return {
      id: faker.datatype.uuid(),
      emv: faker.datatype.string(),
      document: cpf.generate(),
      cityCode: faker.datatype.string(),
      paymentDate: faker.date.recent(),
      key: faker.datatype.string(),
      txId: faker.datatype.string(),
      documentValue: faker.datatype.number({ min: 1, max: 99999 }),
      recipientName: faker.datatype.string(),
      recipientPersonType: randRecipient.type,
      recipientDocument: randRecipient.doc,
      recipientIspb: faker.datatype.number(99999).toString().padStart(8, '0'),
      recipientBranch: faker.datatype.string(),
      recipientAccountType: AccountType.CACC,
      recipientAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      recipientCity: faker.datatype.string(),
      endToEndId: faker.datatype.string(),
      type: DecodedQrCodeType.QR_CODE_STATIC_INSTANT_PAYMENT,
      allowUpdate: faker.datatype.boolean(),
      paymentValue: faker.datatype.number({ min: 1, max: 99999 }),
      pss: faker.datatype.string(),
      expirationDate: faker.date.recent(),
      payerPersonType: PersonType.NATURAL_PERSON,
      payerDocument: cpf.generate(),
      payerName: faker.datatype.string(),
      status: faker.datatype.string(),
      version: faker.datatype.string(),
      additionalInfo: faker.datatype.string(),
      additionalInfos: [
        { name: faker.datatype.string(), value: faker.datatype.string() },
        { name: faker.datatype.string(), value: faker.datatype.string() },
      ],
      withdrawValue: faker.datatype.number({ min: 1, max: 99999 }),
      changeValue: faker.datatype.number({ min: 1, max: 99999 }),
      dueDate: faker.date.recent(),
      interestValue: faker.datatype.number({ min: 1, max: 99999 }),
      fineValue: faker.datatype.number({ min: 1, max: 99999 }),
      deductionValue: faker.datatype.number({ min: 1, max: 99999 }),
      discountValue: faker.datatype.number({ min: 1, max: 99999 }),
      state: DecodedQrCodeState.PENDING,
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      recipientBankName: faker.datatype.string(),
      recipientBankIspb: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      agentIspbWithdrawal: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      agentModWithdrawal: PixAgentMod.AGTEC,
    };
  },
  {
    afterBuild: (model) => {
      return new DecodedQrCodeEntity(model);
    },
  },
);

export const DecodedQrCodeFactory = factory;
