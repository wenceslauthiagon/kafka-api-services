import { Test, TestingModule } from '@nestjs/testing';
import { OccupationModel } from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { OccupationFactory } from '@zro/test/users/config';

describe('OccupationModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const Occupation = await OccupationFactory.create<OccupationModel>(
      OccupationModel.name,
    );
    expect(Occupation).toBeDefined();
    expect(Occupation.codCbo).toBeDefined();
    expect(Occupation.createdAt).toBeDefined();
    expect(Occupation.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
