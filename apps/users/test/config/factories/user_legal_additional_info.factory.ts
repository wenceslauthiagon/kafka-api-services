// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common/test';
import { UserLegalAdditionalInfoEntity } from '@zro/users/domain';
import {
  UserLegalAdditionalInfoModel,
  UserModel,
} from '@zro/users/infrastructure';

/**
 * UserLegalAdditionalInfo factory.
 */
factory.define<UserLegalAdditionalInfoModel>(
  UserLegalAdditionalInfoModel.name,
  UserLegalAdditionalInfoModel,
  () => {
    return {
      userId: factory.assoc(UserModel.name, 'uuid'),
      cnae: faker.datatype.string(30),
      constitutionDesc: faker.datatype.string(50),
      employeeQty: faker.datatype.number(999),
      overseasBranchesQty: faker.datatype.number(999),
      isThirdPartyRelationship: faker.datatype.boolean(),
      isCreditCardAdmin: faker.datatype.boolean(),
      isPatrimonyTrust: faker.datatype.boolean(),
      isPaymentFacilitator: faker.datatype.boolean(),
      isRegulatedPld: faker.datatype.boolean(),
      legalNaturityCode: faker.datatype.string(5),
      createdAt: faker.date.recent(2),
    };
  },
);

const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, UserLegalAdditionalInfoEntity.name);

factory.define<UserLegalAdditionalInfoEntity>(
  UserLegalAdditionalInfoEntity.name,
  DefaultModel,
  async () => {
    return {
      id: faker.datatype.uuid(),
      userId: faker.datatype.uuid(),
      cnae: faker.datatype.string(30),
      constitutionDesc: faker.datatype.string(50),
      employeeQty: faker.datatype.number(999),
      overseasBranchesQty: faker.datatype.number(999),
      isThirdPartyRelationship: faker.datatype.boolean(),
      isCreditCardAdmin: faker.datatype.boolean(),
      isPatrimonyTrust: faker.datatype.boolean(),
      isPaymentFacilitator: faker.datatype.boolean(),
      isRegulatedPld: faker.datatype.boolean(),
      legalNaturityCode: faker.datatype.string(5),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new UserLegalAdditionalInfoEntity(model);
    },
  },
);

export const UserLegalAdditionalInfoFactory = factory;
