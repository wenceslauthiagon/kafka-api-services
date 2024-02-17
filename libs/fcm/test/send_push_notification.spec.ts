import axios from 'axios';
import { JWT } from 'google-auth-library';
import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity } from '@zro/users/domain';
import { PushNotificationMessage } from '@zro/notifications/application';
import { FcmModule, FcmService, FCM_API } from '@zro/fcm/infrastructure';

const mockAuthorize = jest.spyOn(JWT.prototype, 'authorize');
const mockGetAcessToken = jest.spyOn(JWT.prototype, 'getAccessToken');

jest.mock('axios');

const mockPost: any = axios.post;
const mockCreate: any = axios.create;
mockCreate.mockImplementation(() => axios);

describe('Test send notificatoin via push notification', () => {
  let module: TestingModule;
  let fcmService: FcmService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.fcm.env'],
        }),
        FcmModule,
      ],
    }).compile();

    fcmService = module.get(FcmService);
  });

  beforeEach(() => {
    mockPost.mockReset();
  });

  const sendPushNotification = async (message: PushNotificationMessage) => {
    const fcmGateway = await fcmService.getFcmGateway();
    fcmGateway.send(message);
  };

  it('TC0001 - Should send push notification successfully', async () => {
    const message: PushNotificationMessage = {
      uuid: faker.datatype.uuid(),
      description: faker.lorem.paragraphs(1).substring(0, 70),
      title: faker.lorem.word(),
      user: new UserEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        fcmToken: faker.lorem.word(),
      }),
      type: faker.lorem.word(),
    };

    mockAuthorize.mockImplementationOnce(() => Promise.resolve());
    mockGetAcessToken.mockImplementationOnce(() => ({
      token: faker.lorem.word(),
    }));

    await sendPushNotification(message);

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toBe(FCM_API.SEND);
    expect(mockPost.mock.calls[0][1].message.token).toBe(message.user.fcmToken);
    expect(mockPost.mock.calls[0][1].message.notification.title).toBe(
      message.title,
    );
    expect(mockPost.mock.calls[0][1].message.notification.body).toBe(
      message.description,
    );
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
