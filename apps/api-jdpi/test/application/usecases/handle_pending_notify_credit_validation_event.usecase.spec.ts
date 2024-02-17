import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { NotifyCreditValidationEntity } from '@zro/api-jdpi/domain';
import {
  NotifyCreditValidationEventEmitter,
  PixStatementGateway,
  HandlePendingNotifyCreditValidationEventUseCase as UseCase,
  VerifyNotifyCreditPixStatementPspResponse,
} from '@zro/api-jdpi/application';
import {
  generateRandomEndToEndId,
  NotifyCreditValidationFactory,
} from '@zro/test/api-jdpi/config';

describe('HandlePendingNotifyCreditValidationEventUseCase', () => {
  const mockEmitter = () => {
    const eventEmitter: NotifyCreditValidationEventEmitter =
      createMock<NotifyCreditValidationEventEmitter>();

    const mockEmitReadyCreditValidationEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.emitReadyCreditValidation),
    );

    const mockEmitErrorCreditValidationEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.emitErrorCreditValidation),
    );

    return {
      eventEmitter,
      mockEmitReadyCreditValidationEvent,
      mockEmitErrorCreditValidationEvent,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixStatementGateway = createMock<PixStatementGateway>();

    const mockVerifyNotifyCreditPixStatement: jest.Mock = On(pspGateway).get(
      method((mock) => mock.verifyNotifyCreditPixStatement),
    );

    return {
      pspGateway,
      mockVerifyNotifyCreditPixStatement,
    };
  };

  const makeSut = () => {
    const {
      eventEmitter,
      mockEmitReadyCreditValidationEvent,
      mockEmitErrorCreditValidationEvent,
    } = mockEmitter();

    const { pspGateway, mockVerifyNotifyCreditPixStatement } = mockGateway();

    const sut = new UseCase(logger, pspGateway, eventEmitter);

    return {
      sut,
      mockEmitReadyCreditValidationEvent,
      mockEmitErrorCreditValidationEvent,
      mockVerifyNotifyCreditPixStatement,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params.', async () => {
      const {
        sut,
        mockEmitReadyCreditValidationEvent,
        mockEmitErrorCreditValidationEvent,
        mockVerifyNotifyCreditPixStatement,
      } = makeSut();

      const notifyCreditValidation =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          {
            groupId: faker.datatype.uuid(),
            endToEndId: generateRandomEndToEndId(),
          },
        );

      const test = [
        () =>
          sut.execute({
            ...notifyCreditValidation,
            groupId: null,
            endToEndId: null,
            response: null,
          }),
        () =>
          sut.execute({
            ...notifyCreditValidation,
            endToEndId: null,
            response: null,
          }),
        () =>
          sut.execute({
            ...notifyCreditValidation,
            groupId: null,
            response: null,
          }),
        () =>
          sut.execute({
            ...notifyCreditValidation,
            groupId: null,
            endToEndId: null,
          }),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockEmitReadyCreditValidationEvent).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidationEvent).toHaveBeenCalledTimes(0);
      expect(mockVerifyNotifyCreditPixStatement).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should emit ErrorCreditValidation event if response is an error.', async () => {
      const {
        sut,
        mockEmitReadyCreditValidationEvent,
        mockEmitErrorCreditValidationEvent,
        mockVerifyNotifyCreditPixStatement,
      } = makeSut();

      const notifyCreditValidation =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          {
            groupId: faker.datatype.uuid(),
            endToEndId: generateRandomEndToEndId(),
          },
        );

      mockVerifyNotifyCreditPixStatement.mockRejectedValue(new Error());

      await sut.execute(notifyCreditValidation);

      expect(mockEmitReadyCreditValidationEvent).toHaveBeenCalledTimes(0);
      expect(mockEmitErrorCreditValidationEvent).toHaveBeenCalledTimes(1);
      expect(mockVerifyNotifyCreditPixStatement).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should emit ReadyCreditValidation event if response is found.', async () => {
      const {
        sut,
        mockEmitReadyCreditValidationEvent,
        mockEmitErrorCreditValidationEvent,
        mockVerifyNotifyCreditPixStatement,
      } = makeSut();

      const notifyCreditValidation =
        await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
          NotifyCreditValidationEntity.name,
          {
            groupId: faker.datatype.uuid(),
            endToEndId: generateRandomEndToEndId(),
          },
        );

      const pspResponse: VerifyNotifyCreditPixStatementPspResponse = {
        endToEndId: generateRandomEndToEndId(),
        createdAt: new Date(),
      };

      mockVerifyNotifyCreditPixStatement.mockResolvedValue(pspResponse);

      await sut.execute(notifyCreditValidation);

      expect(mockEmitReadyCreditValidationEvent).toHaveBeenCalledTimes(1);
      expect(mockEmitErrorCreditValidationEvent).toHaveBeenCalledTimes(0);
      expect(mockVerifyNotifyCreditPixStatement).toHaveBeenCalledTimes(1);
    });
  });
});
