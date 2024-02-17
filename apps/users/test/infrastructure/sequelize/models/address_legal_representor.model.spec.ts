import { Test, TestingModule } from '@nestjs/testing';
import { AddressLegalRepresentorModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AddressLegalRepresentorFactory } from '@zro/test/users/config';

describe('AddressLegalRepresentorModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const addressLegalRepresentor =
      await AddressLegalRepresentorFactory.create<AddressLegalRepresentorModel>(
        AddressLegalRepresentorModel.name,
      );

    expect(addressLegalRepresentor).toBeDefined();
    expect(addressLegalRepresentor.id).toBeDefined();
    expect(addressLegalRepresentor.createdAt).toBeDefined();
    expect(addressLegalRepresentor.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
