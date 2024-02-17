// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import { DefaultModel } from '@zro/common';
import { ReportUserModel } from '@zro/reports/infrastructure';
import { ReportUserEntity } from '@zro/reports/domain';
import {
  AddressEntity,
  OccupationEntity,
  OnboardingEntity,
  UserLegalAdditionalInfoEntity,
  PersonType,
  UserEntity,
  UserState,
} from '@zro/users/domain';
import { AdminEntity } from '@zro/admin/domain';
import { UserLimitEntity } from '@zro/operations/domain';
import {
  AddressFactory,
  OccupationFactory,
  OnboardingFactory,
  UserLegalAdditionalInfoFactory,
  UserFactory,
} from '@zro/test/users/config';
import { AdminFactory } from '@zro/test/admin/config';
import { UserLimitFactory } from '@zro/test/operations/config';

const fakerModel = async () => {
  const user = await UserFactory.create<UserEntity>(UserEntity.name);
  const address = await AddressFactory.create<AddressEntity>(
    AddressEntity.name,
    { user },
  );
  const onboarding = await OnboardingFactory.create<OnboardingEntity>(
    OnboardingEntity.name,
    { user },
  );
  const admin = await AdminFactory.create<AdminEntity>(AdminEntity.name);
  const userLimit = await UserLimitFactory.create<UserLimitEntity>(
    UserLimitEntity.name,
    { user },
  );
  const occupation = await OccupationFactory.create<OccupationEntity>(
    OccupationEntity.name,
  );
  const userLegalAdditionalInfo =
    await UserLegalAdditionalInfoFactory.create<UserLegalAdditionalInfoEntity>(
      UserLegalAdditionalInfoEntity.name,
    );

  return {
    id: faker.datatype.uuid(),
    user,
    address,
    onboarding,
    admin,
    userLimit,
    occupation,
    userLegalAdditionalInfo,
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
};

/**
 * ReportUser model factory.
 */
factory.define<ReportUserModel>(ReportUserModel.name, ReportUserModel, () => {
  return {
    id: faker.datatype.uuid(),
    userId: faker.datatype.uuid(),
    fullName: faker.name.fullName(),
    phoneNumber:
      '551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
    document: cpf.generate(),
    userDeletedAt: null,
    userUpdatedAt: faker.date.recent(),
    state: UserState.ACTIVE,
    email: faker.internet.email(
      faker.name.firstName(),
      faker.name.lastName() + faker.datatype.number(9999).toString(),
      'zrobank.com.br',
    ),
    type: PersonType.NATURAL_PERSON,
    addressStreet: faker.address.streetAddress(),
    addressNumber: faker.datatype.number({ min: 1, max: 99999 }),
    addressCity: faker.address.cityName(),
    addressFederativeUnit: faker.address.cityName(),
    addressCountry: faker.address.country(),
    addressZipCode: faker.datatype.number(9999999).toString().padStart(8, '0'),
    onboardingUpdatedAt: faker.date.recent(),
    adminName: faker.name.firstName(),
    dailyLimit: faker.datatype.number({ min: 1, max: 99999 }),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
});

/**
 * ReportUser entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, ReportUserEntity.name);

factory.define<ReportUserEntity>(
  ReportUserEntity.name,
  DefaultModel,
  fakerModel,
  {
    afterBuild: (model) => {
      return new ReportUserEntity(model);
    },
  },
);

export const ReportUserFactory = factory;
