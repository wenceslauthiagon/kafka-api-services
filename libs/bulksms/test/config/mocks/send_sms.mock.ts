import { v4 as uuidV4 } from 'uuid';

export function bulksmsSendSmsMockSuccess(
  to = '+5511987654321',
  body = 'Hello World',
) {
  return Promise.resolve({
    status: 201,
    data: {
      id: uuidV4(),
      type: 'SENT',
      to,
      body,
      status: {
        id: 'SENT.null',
        type: 'SENT',
        subtype: null,
      },
    },
  });
}

export function bulksmsSendSmsMockFail(
  to = '+5511987654321',
  body = 'Hello World',
) {
  return Promise.resolve({
    status: 201,
    data: {
      id: uuidV4(),
      type: 'SENT',
      to,
      body,
      status: {
        id: 'FAILED.NOT_SENT',
        type: 'FAILED',
        subtype: 'NOT_SENT',
      },
    },
  });
}
