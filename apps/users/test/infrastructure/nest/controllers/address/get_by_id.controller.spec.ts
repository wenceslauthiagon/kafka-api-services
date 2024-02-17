import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common/test';
import { AddressRepository } from '@zro/users/domain';
import { AddressNotFoundException } from '@zro/users/application';
import {
  AddressModel,
  GetAddressByIdMicroserviceController as Controller,
  AddressDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AddressFactory, UserFactory } from '@zro/test/users/config';
import { GetAddressByIdRequest } from '@zro/users/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('AddressController', () => {
  let module: TestingModule;
  let controller: Controller;
  let addressRepository: AddressRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    addressRepository = new AddressDatabaseRepository();
  });

  describe('GetAddressById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get address successfully', async () => {
        const userCreated = await UserFactory.create<UserModel>(UserModel.name);
        const address = await AddressFactory.create<AddressModel>(
          AddressModel.name,
          {
            userId: userCreated.id,
          },
        );

        const message: GetAddressByIdRequest = {
          id: address.id,
          userId: userCreated.uuid,
        };

        const result = await controller.execute(
          addressRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(address.id);
        expect(result.value.city).toBe(address.city);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get address with incorrect id', async () => {
        const message: GetAddressByIdRequest = {
          id: 9999,
          userId: uuidV4(),
        };

        const testScript = () =>
          controller.execute(addressRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(AddressNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
