// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import factory, { ObjectAdapter } from 'factory-girl';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { DefaultModel } from '@zro/common';
import { UserLegalRepresentorEntity } from '@zro/users/domain';
import { ReportUserLegalRepresentorEntity } from '@zro/reports/domain';
import { ReportUserLegalRepresentorModel } from '@zro/reports/infrastructure';
import { UserLegalRepresentorFactory } from '@zro/test/users/config';

/**
 * ReportUserLegalRepresentor model factory.
 */
factory.define<ReportUserLegalRepresentorModel>(
  ReportUserLegalRepresentorModel.name,
  ReportUserLegalRepresentorModel,
  async () => {
    const userLegalRepresentor =
      await UserLegalRepresentorFactory.create<UserLegalRepresentorEntity>(
        UserLegalRepresentorEntity.name,
      );

    return {
      id: faker.datatype.uuid(),
      userLegalRepresentorId: userLegalRepresentor.id,
      personType: userLegalRepresentor.personType,
      document: userLegalRepresentor.document,
      name: userLegalRepresentor.name,
      birthDate: userLegalRepresentor.birthDate,
      type: userLegalRepresentor.type,
      isPublicServer: userLegalRepresentor.isPublicServer,
      userLegalRepresentorCreatedAt: userLegalRepresentor.createdAt,
      userLegalRepresentorUpdatedAt: userLegalRepresentor.updatedAt,
      userId: userLegalRepresentor.user.uuid,
      userDocument: userLegalRepresentor.user.document,
      addressZipCode: userLegalRepresentor.address.zipCode,
      addressStreet: userLegalRepresentor.address.street,
      addressNumber: userLegalRepresentor.address.number,
      addressNeighborhood: userLegalRepresentor.address.neighborhood,
      addressCity: userLegalRepresentor.address.city,
      addressFederativeUnit: userLegalRepresentor.address.federativeUnit,
      addressCountry: userLegalRepresentor.address.country,
      addressComplement: userLegalRepresentor.address.complement,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  },
);

/**
 * ReportUserLegalRepresentor entity factory.
 */
const objectAdapter = new ObjectAdapter();
factory.setAdapter(objectAdapter, ReportUserLegalRepresentorEntity.name);

factory.define<ReportUserLegalRepresentorEntity>(
  ReportUserLegalRepresentorEntity.name,
  DefaultModel,
  async () => {
    const userLegalRepresentor =
      await UserLegalRepresentorFactory.create<UserLegalRepresentorEntity>(
        UserLegalRepresentorEntity.name,
      );

    return {
      id: faker.datatype.uuid(),
      userLegalRepresentor,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    };
  },
  {
    afterBuild: (model) => {
      return new ReportUserLegalRepresentorEntity(model);
    },
  },
);

export const ReportUserLegalRepresentorFactory = factory;
